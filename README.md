# RBIVoice

RBIVoiceInput（PC 側アプリ）が Firestore に書き込む文字起こし結果を、ブラウザから閲覧する読み取り専用の Web ビューア。

## セットアップ

```powershell
pnpm install
cp .env.local.example .env.local
# .env.local の VITE_FIREBASE_* / VITE_RECAPTCHA_SITE_KEY を入力
pnpm dev
```

ローカル開発で App Check を通すには、`.env.local` に
`VITE_APPCHECK_DEBUG_TOKEN=true` を一度設定し、ブラウザコンソールに
出力されるデバッグトークンを Firebase コンソールへ登録する。

## ビルドとデプロイ

```powershell
pnpm build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

## URL

`https://<host>/?room=<roomId>` で対象部屋を指定する。`?room` 未指定時はガード画面を表示する。
