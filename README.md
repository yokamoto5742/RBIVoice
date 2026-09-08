# RBIVoice

RBIVoice は、音声文字起こし結果をリアルタイムで表示する Web ビューアーです。外部の音声入力アプリRBIVoiceInput が Firestore に書き込んだテキストを、ブラウザ上でリアルタイムに確認・編集・コピーできます。

## 特徴

- **リアルタイム表示** — Firestore の `onSnapshot` により、音声入力アプリが書き込んだテキストが即座に反映される
- **プレゼンス表示** — 音声入力アプリの接続状態（音声入力中 / 待機中 / 切断）をリアルタイムで表示
- **テキスト編集** — 録音中でない場合は文字起こし結果を手動で編集・保存・クリアできる
- **TTL 自動消去** — 文字起こしは 10 分後に自動で期限切れになりクライアント側で空白扱いになる

## インストール方法

### 前提条件

- Node.js 20 以上
- pnpm 9.0.0 以上
- Firebase プロジェクト（Firestore 有効化済み）

### セットアップ

1. リポジトリをクローンする

   ```bash
   git clone https://github.com/yokamoto5742/RBIVoice
   cd rbivoice
   ```

2. 依存パッケージをインストールする

   ```bash
   pnpm install
   ```

3. 環境変数を設定する

   `.env.local` をプロジェクトルートに作成し、Firebase コンソールから取得した値を設定する：

   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_APP_ID=
   VITE_RECAPTCHA_SITE_KEY=        # 本番用 reCAPTCHA Enterprise サイトキー
   VITE_APPCHECK_DEBUG_TOKEN=      # 開発時: true にするとコンソールにデバッグトークンが出る
   ```

4. Firestore セキュリティルールをデプロイする

   ```bash
   firebase deploy --only firestore:rules
   ```

## 使い方

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで `http://localhost:5173/?room=<ユーザーID>` を開く。

### 部屋の指定

URL クエリパラメータ `?room=<roomId>` でユーザーIDを指定する。

```
https://example.com/?room=tanaka-pc
```

パラメータがない場合は使い方の案内ページが表示される。

### 主な操作

| 操作 | 説明 |
|------|------|
| テキスト編集 | 音声入力中でない場合にテキストエリアを直接編集できる |
| 保存 | 編集内容を Firestore に保存する（音声入力中は無効） |
| クリア | 文字起こし内容を即時消去する（音声入力中も実行可） |
| コピー | 表示中のテキスト全文をクリップボードにコピーする |
| 改行除去 | テキストから改行をすべて取り除く（音声入力中は無効） |
| 句読点削除 | テキストから句読点（、。）をすべて除去する（音声入力中は無効） |

### ビルド

```bash
pnpm build
```

`dist/` ディレクトリに静的ファイルが生成される。

### テスト

```bash
pnpm test           # 全件実行
pnpm test:watch     # ウォッチモード

# 単一ファイル
pnpm exec vitest run src/lib/room.test.ts
pnpm exec vitest run src/hooks/usePresence.test.ts
```

## Firestore データ構造

```
rooms/{roomId}/
  transcript/body   # Transcript: { text, updatedAt, expiresAt }
  meta/state        # PresenceState: { recording, lastPing, senderId }
```

- `transcript/body` — Web アプリから read / update / delete 可（create 不可）
- `meta/state` — Web アプリから read のみ（write はRBIVoiceInput が担う）

## トラブルシューティング

### ページが真っ白になる

- ブラウザのコンソールで Firebase の設定エラーを確認する
- `.env.local` に必要な環境変数がすべて設定されているか確認する

### 文字起こしが表示されない

- URL に `?room=<roomId>` が含まれているか確認する
- 外部の音声入力アプリが同じ `roomId` で Firestore に書き込んでいるか確認する
- Firestore セキュリティルールが正しくデプロイされているか確認する

### App Check エラーが出る（開発時）

`.env.local` に以下を設定してデバッグトークンを有効にする：

```
VITE_APPCHECK_DEBUG_TOKEN=true
```

ブラウザのコンソールに出力されるトークンを Firebase コンソールの App Check に登録する。

### 文字起こしが消えている

`expiresAt` から 10 分が経過するとクライアント側で空文字扱いになる。これは仕様による自動消去であり、外部アプリが再度書き込むと復元される。

## ライセンス

このプロジェクトのライセンス情報については、[LICENSE](docs/LICENSE) を参照してください。

## 更新履歴

更新履歴は [CHANGELOG.md](docs/CHANGELOG.md) を参照してください。
