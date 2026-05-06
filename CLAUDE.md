# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # TypeScript チェック + Vite ビルド
pnpm typecheck    # 型チェックのみ
pnpm test         # Vitest 全件実行
pnpm test:watch   # ウォッチモード
```

単一テスト実行:
```bash
pnpm exec vitest run src/lib/room.test.ts
pnpm exec vitest run src/hooks/usePresence.test.ts
```

## 環境変数

`.env.local` に以下を設定する（Firebase コンソールから取得）:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_RECAPTCHA_SITE_KEY=
VITE_APPCHECK_DEBUG_TOKEN=   # 開発時: true にするとコンソールにデバッグトークンが出る
```

## アーキテクチャ概要

音声文字起こし結果をリアルタイムで表示する Web ビューアー。外部の音声入力アプリ（iOS等）が Firestore に書き込み、この Web アプリがそれを読み取る構成。

### ルーティング

URL クエリパラメータ `?room=<roomId>` で部屋を特定する。パラメータがない場合は `RoomGate` コンポーネントが使い方を案内する（`src/lib/room.ts`）。

### Firestore データ構造

```
rooms/{roomId}/
  transcript/body   # Transcript: { text, updatedAt, expiresAt }
  meta/state        # PresenceState: { recording, lastPing, senderId }
```

- `transcript/body`: Web アプリから read/update/delete 可（create 不可）
- `meta/state`: Web アプリから read のみ（write は外部アプリが担う）
- `expiresAt` は `TRANSCRIPT_TTL_MS`（10分）後のタイムスタンプ。期限切れテキストはクライアント側で空文字扱い

### データフロー

- `useTranscript(roomId)` — Firestore `onSnapshot` でリアルタイム購読
- `usePresence(roomId)` — `meta/state` を購読し、`PRESENCE_TIMEOUT_MS`（30秒）以内の `lastPing` でオンライン判定。1秒ごとにポーリングして `recording` / `idle` / `disconnected` を算出
- 録音中（`status === 'recording'`）はテキスト編集・保存・クリアが無効化される

### 定数・UI テキスト

`src/constants.ts` で一元管理。UI に表示するすべての文字列は `UI_TEXT` オブジェクトから参照する。マジック文字列を直接コンポーネントに書かない。

### App Check

本番環境では reCAPTCHA Enterprise による App Check が有効。`VITE_RECAPTCHA_SITE_KEY` が未設定の場合はスキップされる。
