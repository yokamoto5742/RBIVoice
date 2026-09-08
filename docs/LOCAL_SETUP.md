# ローカル環境での起動手順

RBIVoice（音声文字起こし結果のリアルタイム Web ビューアー）をローカル PC で動かすための手順書。

## 1. 前提条件

| ツール | 必要バージョン | 確認コマンド |
|--------|----------------|--------------|
| Node.js | 20 以上 | `node -v` |
| pnpm | 9.0.0 以上 | `pnpm -v` |
| Firebase CLI | 任意（ルールのデプロイ時のみ） | `firebase --version` |

- Firestore を有効化した Firebase プロジェクトが必要（このリポジトリの既定は `.firebaserc` の `gen-lang-client-0605794434`）
- pnpm が未導入の場合: `npm install -g pnpm@9`

## 2. リポジトリの取得

```bash
git clone https://github.com/yokamoto5742/RBIVoice
cd RBIVoice
```

## 3. 依存パッケージのインストール

```bash
pnpm install
```

## 4. 環境変数の設定

プロジェクトルートに `.env.local` を作成する（`.gitignore` 済み、コミットされない）。

```
VITE_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxx
VITE_RECAPTCHA_SITE_KEY=
VITE_APPCHECK_DEBUG_TOKEN=true
```

値の取得元: Firebase コンソール → プロジェクトの設定 → マイアプリ（ウェブアプリ）→ SDK setup and configuration。

ローカル開発時のポイント:

- `VITE_RECAPTCHA_SITE_KEY` を**空のままにすると App Check の初期化がスキップされる**（`src/lib/firebase.ts`）。まずは空で動かすのが最も簡単
- 本番と同じ App Check を有効にして検証したい場合は、サイトキーを設定したうえで `VITE_APPCHECK_DEBUG_TOKEN=true` を指定し、ブラウザコンソールに出力されるデバッグトークンを Firebase コンソールの App Check に登録する
- `.env.local` を編集したら開発サーバーを再起動する（Vite は起動時にのみ読み込む）

## 5. Firestore セキュリティルールの反映（初回のみ）

自分の Firebase プロジェクトで動かす場合は、ルールをデプロイする。

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

既にルールがデプロイ済みのプロジェクトを使う場合はこの手順は不要。

## 6. 開発サーバーの起動

```bash
pnpm dev
```

`http://localhost:5173` で起動する（ポートは `vite.config.ts` で固定）。

## 7. ブラウザで開く

ユーザーIDをクエリパラメータで指定してアクセスする。

```
http://localhost:5173/?room=tanaka-pc
```

- `?room=` がない場合は「ユーザーIDが指定されていません」という案内ページが表示される
- `room` の値は、音声入力アプリ RBIVoiceInput 側が書き込んでいるユーザーIDと一致させる

## 8. 動作確認

Firestore の以下のドキュメントを読み取って画面に反映する。

```
rooms/{roomId}/
  transcript/body   # { text, updatedAt, expiresAt }
  meta/state        # { recording, lastPing, senderId }
```

音声入力アプリが手元にない場合は、Firebase コンソールの Firestore 画面から手動でドキュメントを作成すると表示を確認できる。

1. `rooms/tanaka-pc/transcript/body` を作成
   - `text`（string）: 任意のテキスト
   - `updatedAt`（timestamp）: 現在時刻
   - `expiresAt`（timestamp）: 現在時刻 + 10 分（過ぎていると空文字扱いになる）
2. ブラウザにテキストが即時反映されることを確認する
3. 接続状態バッジは `rooms/tanaka-pc/meta/state` の `lastPing` が 30 秒以内なら「音声入力中」/「待機中」、それ以外は「切断」になる

> `transcript/body` はセキュリティルール上 Web アプリから作成できない（read / update / delete のみ）。最初のドキュメント作成は音声入力アプリまたは Firebase コンソールから行う。

## 9. その他のコマンド

```bash
pnpm typecheck    # 型チェックのみ
pnpm build        # 型チェック + 本番ビルド（dist/ に出力）
pnpm preview      # ビルド結果をローカルで確認
pnpm test         # Vitest 全件実行
pnpm test:watch   # ウォッチモード

pnpm exec vitest run src/lib/room.test.ts        # 単一ファイル実行
pnpm exec vitest run src/hooks/usePresence.test.ts
```

## 10. トラブルシューティング

| 症状 | 対処 |
|------|------|
| 画面が真っ白 | ブラウザコンソールを確認。`.env.local` の Firebase 設定値の不足・誤りが原因のことが多い |
| 案内ページのまま | URL に `?room=<ユーザーID>` を付けているか確認 |
| `Firebase: Error (auth/invalid-api-key)` | `VITE_FIREBASE_API_KEY` の値と、サーバー再起動の有無を確認 |
| App Check のエラー | ローカルでは `VITE_RECAPTCHA_SITE_KEY` を空にする、または `VITE_APPCHECK_DEBUG_TOKEN=true` でデバッグトークンを登録する |
| `permission-denied` | Firestore ルールが未デプロイ。`firebase deploy --only firestore:rules` を実行 |
| テキストが表示されない / 消える | `expiresAt` から 10 分経過するとクライアント側で空文字扱いになる仕様。Firestore の値を確認 |
| ポート 5173 が使用中 | 既存プロセスを停止するか、`pnpm dev --port 5174` で別ポートを指定 |