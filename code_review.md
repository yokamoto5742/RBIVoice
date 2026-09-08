# コードレビュー — RBIVoice

対象: `src/**`, `firestore.rules`, `vite.config.ts`, `package.json`
観点: 可読性 / 保守性 / KISS

---

## 総評

規模に対して構成は素直で、`lib` / `hooks` / `components` の分離、`constants.ts` への UI テキスト集約、`computeStatus` の純関数抽出は良い設計。

一方で **ビルドが通らない**、**TTL 期限切れテキストが消えない** という 2 つの実害のある不具合がある。また「投機的に用意したが誰も使っていないコード」と「コピペされた Tailwind クラス文字列」が保守性を下げている。

| 優先度 | 件数 | 概要 |
|---|---|---|
| 🔴 Critical | 3 | ビルド失敗 / TTL 未反映 / Firestore ルール過剰権限 |
| 🟡 保守性 | 5 | クラス文字列重複、型の置き場所、フィードバック処理 |
| 🟢 KISS | 6 | デッドコード・不要な useMemo・重複関数 |

---

## 🔴 Critical

### C-1. `pnpm build` / `pnpm typecheck` が失敗する

```
vite.config.ts(10,3): error TS2769: No overload matches this call.
  Object literal may only specify known properties, and 'test' does not exist in type 'UserConfigExport'.
```

Vite 8 + Vitest 5 では `vite` の `defineConfig` に `test` を渡せない。`/// <reference types="vitest" />` は現行バージョンでは効かない。CI もローカルもビルドが通らない状態なので最優先。

```diff
--- a/vite.config.ts
+++ b/vite.config.ts
-/// <reference types="vitest" />
-import { defineConfig } from 'vite';
+import { defineConfig } from 'vitest/config';
 import react from '@vitejs/plugin-react-oxc';
```

ついでに `@vitejs/plugin-react-oxc` は非推奨警告が出ている（`@vitejs/plugin-react` に統合済み）。

---

### C-2. TTL 経過後もテキストが画面に残り続ける

`src/App.tsx:29-34`

```ts
const liveText = useMemo(() => {
  if (!transcript) return '';
  const expiresMs = transcript.expiresAt?.toMillis() ?? Number.POSITIVE_INFINITY;
  if (expiresMs <= Date.now()) return '';   // ← Date.now() は依存配列に入らない
  return transcript.text;
}, [transcript]);                            // ← transcript が変わるまで再計算されない
```

依存配列が `[transcript]` のみなので、`Date.now()` が進んでも再評価されない。`usePresence` の 1 秒 tick で再レンダリングは起きるが、`useMemo` がキャッシュ値を返すため **期限切れ後もテキストが表示され続ける**。

外部アプリが書き込みを止めた時（＝まさに TTL で消したい状況）に限って消えないという最悪の挙動で、`UI_TEXT.autoDeleteNotice` が謳う「一定時間後に自動消去」が守られていない。

**修正方針（副次的に KISS 改善にもなる）**: 現在時刻を 1 本のフックに集約し、presence と TTL 判定の両方で共有する。純関数化されるのでテストも書ける。

```ts
// src/hooks/useNow.ts （新規）
import { useEffect, useState } from 'react';

export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
```

```diff
--- a/src/lib/transcript.ts
+++ b/src/lib/transcript.ts
+/** 期限切れの文字起こしは空文字として扱う */
+export function activeText(transcript: Transcript | null, now: number): string {
+  if (!transcript) return '';
+  const expiresMs = transcript.expiresAt?.toMillis() ?? Number.POSITIVE_INFINITY;
+  return expiresMs <= now ? '' : transcript.text;
+}
```

```diff
--- a/src/hooks/usePresence.ts
+++ b/src/hooks/usePresence.ts
-export function usePresence(roomId: string): PresenceResult {
+export function usePresence(roomId: string, now: number): PresenceStatus {
   const [state, setState] = useState<PresenceState | null>(null);
-  const [now, setNow] = useState<number>(() => Date.now());
@@
-  useEffect(() => {
-    const id = window.setInterval(() => setNow(Date.now()), PRESENCE_TICK_MS);
-    return () => window.clearInterval(id);
-  }, []);
-
-  return { status: computeStatus(state, now), state };
+  return computeStatus(state, now);
 }
```

```diff
--- a/src/App.tsx
+++ b/src/App.tsx
+  const now = useNow(PRESENCE_TICK_MS);
   const transcript = useTranscript(roomId);
-  const { status } = usePresence(roomId);
+  const status = usePresence(roomId, now);
@@
-  const liveText = useMemo(() => {
-    if (!transcript) return '';
-    const expiresMs = transcript.expiresAt?.toMillis() ?? Number.POSITIVE_INFINITY;
-    if (expiresMs <= Date.now()) return '';
-    return transcript.text;
-  }, [transcript]);
+  const liveText = activeText(transcript, now);
```

---

### C-3. Firestore ルールが実質フルオープン

`firestore.rules`

```
match /rooms/{roomId}/transcript/body {
  allow read, update, delete: if true;
```

- roomId は `tanaka-pc` のような推測可能な文字列。App Check だけが唯一の防御線で、**roomId さえ分かれば第三者が他人の文字起こしを読み・書き換え・削除できる**。医療現場での利用が前提なら（`autoDeleteNotice` の文面から推測）許容しづらい。
- `delete` はアプリコードから一度も呼ばれていない（`clearTranscript` は `updateDoc` で空文字更新）。最小権限として削除すべき。
- `update` のフィールド検証が無く、任意サイズ・任意フィールドを書き込める。

最低限の締め（認証導入までの暫定案）:

```diff
     match /rooms/{roomId}/transcript/body {
-      allow read, update, delete: if true;
+      allow read: if true;
+      allow update: if request.resource.data.keys().hasOnly(['text', 'updatedAt', 'expiresAt'])
+                    && request.resource.data.text is string
+                    && request.resource.data.text.size() <= 20000;
+      allow delete: if false;
       allow create: if false;
     }
```

本来は Firebase Auth（匿名認証でも可）＋ `roomId` の所有者チェックが望ましい。**設計判断が必要なため、意図的な割り切りであればその旨をルールにコメントで残してほしい。**

---

## 🟡 保守性

### M-1. Tailwind クラス文字列が 4 箇所にコピペされている

`src/components/ToolBar.tsx:60,69,78,87` — 同一の 200 文字超のクラス文字列が 3 回、blue 版が 1 回。1 箇所直し忘れる典型的な事故源。ボタンを 1 コンポーネントに切り出すのが最小の解。

```tsx
// ToolBar.tsx 内に置くだけで十分（他所で使わないなら別ファイル化は不要）
const BASE = 'rounded-md border px-3 py-1.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:opacity-40';
const NEUTRAL = 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700';
const PRIMARY = 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40';

function Button({ variant = 'neutral', ...props }: React.ComponentProps<'button'> & { variant?: 'neutral' | 'primary' }) {
  return <button type="button" {...props} className={`${BASE} ${variant === 'primary' ? PRIMARY : NEUTRAL}`} />;
}
```

呼び出し側は `<Button onClick={handleCopy} title={...} disabled={...}>{UI_TEXT.copyButton}</Button>` の 1 行になる。

---

### M-2. `handleFeedback` のタイマーがリークし、連打で表示が崩れる

`src/App.tsx:24-27`

```ts
function handleFeedback(msg: string) {
  setFeedback(msg);
  window.setTimeout(() => setFeedback(''), 1500);   // クリアされない / 重複する
}
```

- コピー → 保存と続けて押すと、先のタイマーが後のメッセージを早期に消す。
- アンマウント後にも発火する。
- `1500` がマジックナンバー。プロジェクト規約（`constants.ts` 一元管理）にも反する。

```diff
+// constants.ts
+export const FEEDBACK_DURATION_MS = 1500;
```

```diff
-  const [feedback, setFeedback] = useState<string>('');
-
-  function handleFeedback(msg: string) {
-    setFeedback(msg);
-    window.setTimeout(() => setFeedback(''), 1500);
-  }
+  const [feedback, setFeedback] = useState('');
+
+  useEffect(() => {
+    if (!feedback) return;
+    const id = window.setTimeout(() => setFeedback(''), FEEDBACK_DURATION_MS);
+    return () => window.clearTimeout(id);
+  }, [feedback]);
```

`handleFeedback` は `setFeedback` そのものに置き換わり、関数が 1 つ減る。

---

### M-3. `PresenceStatus` の置き場所が `types.ts` と食い違っている

`PresenceState` は `src/types.ts` にあるのに、`PresenceStatus` は `src/hooks/usePresence.ts` からエクスポートされ、`PresenceBadge.tsx:2` が **表示コンポーネントからフックを import** している。型は `types.ts` に寄せて、コンポーネント → フックの依存を切るべき。

---

### M-4. Firestore から読むデータの検証が非対称

`useTranscript.ts:21` は `text` だけ `typeof` チェックしているが、`updatedAt` / `expiresAt` は素通し。これらは **外部の別アプリが書き込む値** なので、`expiresAt` が Timestamp でなければ `expiresAt.toMillis()` が実行時に落ちる（C-2 の `activeText` も同様）。

```diff
-          updatedAt: data.updatedAt ?? null,
-          expiresAt: data.expiresAt ?? null,
+          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
+          expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt : null,
```

`usePresence.ts:31` の `lastPing` も同様。

---

### M-5. ESLint が一切機能していない

- `eslint.config.js` の `files` が `**/*.{js,jsx}` — **`.ts` / `.tsx` が対象外**。実質何も検査していない。
- `package.json` に `lint` スクリプトも eslint 関連の devDependencies（`eslint`, `@eslint/js`, `globals`, `eslint-plugin-react-hooks`）も存在しない。設定ファイルだけが取り残されている。

`eslint-plugin-react-hooks` が動いていれば **C-2 の `exhaustive-deps` 違反は検出できた**。

使うなら依存を入れて `files: ['**/*.{ts,tsx}']` に直し、使わないなら `eslint.config.js` を削除して混乱を無くす。どちらかに倒すべき。

---

## 🟢 KISS — 削除・単純化候補

### K-1. デッドコード

| 箇所 | 内容 |
|---|---|
| `src/lib/firebase.ts:36` | `export { app }` — どこからも import されていない |
| `src/hooks/usePresence.ts:9-12` | `PresenceResult.state` — 消費者ゼロ。C-2 の修正で型ごと不要 |
| `src/components/TranscriptView.tsx:32-34` | `useEffect(() => { stickToBottomRef.current = true }, [])` — `useRef<boolean>(true)` で既に true。**完全な no-op** |
| `src/main.tsx:5` | `import './lib/firebase'` — hooks 経由で必ず読まれるので冗長（初期化順序の明示が意図なら 1 行コメントを） |

### K-2. `clearTranscript` は `saveTranscriptText` の特殊ケース

`src/lib/transcript.ts:21-27` は `saveTranscriptText(roomId, '')` と完全に等価。関数を 1 つ減らせる。

```diff
-export async function clearTranscript(roomId: string): Promise<void> {
-  await updateDoc(transcriptRef(roomId), {
-    text: '',
-    updatedAt: Timestamp.now(),
-    expiresAt: nextExpiresAt(),
-  });
-}
```

呼び出し側は `saveTranscriptText(roomId, '')`。名前の意図が欲しければ `export const clearTranscript = (roomId: string) => saveTranscriptText(roomId, '');` の 1 行で足りる。

### K-3. `PresenceBadge` の `unknown` は `disconnected` と完全に同一定義

`src/components/PresenceBadge.tsx:11-12` — ラベルもクラスも 1 文字違わない。

`computeStatus` は「state が null（未取得）」を `unknown`、「lastPing が古い」を `disconnected` と区別しているが、**UI もロジックもこの区別を一切使っていない**。状態を 3 つに減らせる。

```diff
-export type PresenceStatus = 'recording' | 'idle' | 'disconnected' | 'unknown';
+export type PresenceStatus = 'recording' | 'idle' | 'disconnected';
```

```diff
 export function computeStatus(state: PresenceState | null, now: number): PresenceStatus {
-  if (!state) return 'unknown';
+  if (!state) return 'disconnected';
```

これで `STYLE` の重複エントリも消える。区別が将来必要なら、その時に足せばよい（YAGNI）。
（テスト `usePresence.test.ts:17-19` の期待値 1 行を更新）

### K-4. ドットの色だけ `STYLE` の外で三項演算子になっている

`src/components/PresenceBadge.tsx:22-25` — バッジ色は `STYLE` マップ、ドット色はネストした三項演算子、と管理場所が分かれている。`STYLE` に `dot` を足せば分岐が消える。

```diff
-const STYLE: Record<PresenceStatus, { label: string; cls: string }> = {
-  recording: { label: ..., cls: '...' },
+const STYLE: Record<PresenceStatus, { label: string; cls: string; dot: string }> = {
+  recording: { label: ..., cls: '...', dot: 'animate-pulse bg-green-500' },
```

### K-5. プレースホルダーを textarea の `value` に流し込んでいる

`src/components/TranscriptView.tsx:36-40`

```ts
const showPlaceholder = readOnly && text.length === 0;
const display = useMemo(() => (showPlaceholder ? UI_TEXT.emptyTranscript : text), [showPlaceholder, text]);
```

`（まだ文字起こしはありません）` が **実データとして textarea に入る**ため、ユーザーが本文を範囲選択してコピーするとこの文言まで入る。

HTML の `placeholder` 属性を使えば意図どおりで、`useMemo`・`display`・`showPlaceholder` の 3 つが丸ごと消える（文字列の三項演算子に `useMemo` は元々不要）。

```diff
-  const showPlaceholder = readOnly && text.length === 0;
-  const display = useMemo(() => (showPlaceholder ? UI_TEXT.emptyTranscript : text), [showPlaceholder, text]);
-
   return (
     <textarea
       ref={ref}
       readOnly={readOnly}
-      value={display}
+      value={text}
+      placeholder={UI_TEXT.emptyTranscript}
```

`useMemo` が消えることで `import { useMemo }` も不要になる。

### K-6. 推論可能な型注釈が冗長

`useState<string>('')` `useState<boolean>(false)` `useRef<boolean>(true)` など（`App.tsx:22,36,37,38`、`ToolBar.tsx:15`、`TranscriptView.tsx:14`）。

初期値から自明なので注釈は削れる。`useRef<HTMLTextAreaElement | null>(null)` のように **初期値から推論できないものだけ** 残すと、注釈があること自体が「ここは推論できない」というシグナルになる。

---

## その他

### O-1. クリア成功時だけフィードバックが出ない

`ToolBar.tsx:39-49` の `handleClear` は失敗時のみ `onFeedback` を呼ぶ。`handleSave` は成功時も呼ぶ。`UI_TEXT` に `clearSuccess` が無いのも含めて非対称。意図的でなければ揃えるべき。

### O-2. テストのカバー範囲

現状 `room.ts` と `computeStatus` のみ。**最も壊れやすい TTL 期限切れ判定（C-2）にテストが無い**のが今回のバグを見逃した原因。

C-2 で `activeText` を純関数化すれば、そのまま以下が書ける。

```ts
describe('activeText', () => {
  it('expiresAt を過ぎたテキストは空文字を返す', () => {
    const t = { text: 'あ', updatedAt: null, expiresAt: Timestamp.fromMillis(now - 1) };
    expect(activeText(t, now)).toBe('');
  });
  it('expiresAt 前ならテキストを返す', () => { /* ... */ });
  it('transcript が null なら空文字を返す', () => {
    expect(activeText(null, now)).toBe('');
  });
});
```

---

## 推奨着手順

1. **C-1** `vite.config.ts` 修正 — これが通らないと他の検証ができない
2. **C-2** TTL バグ修正 ＋ `activeText` のテスト追加（O-2）
3. **C-3** Firestore ルールの最小権限化
4. **K-1 〜 K-5** デッドコード削除・単純化 — 差分が小さく回帰リスクが低い
5. **M-1, M-2** ToolBar のボタン共通化、フィードバックのタイマー修正
6. **M-5** ESLint を有効化するか、設定ファイルを削除するかを決める
