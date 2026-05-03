# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

RBIVoice は **RBIVoiceInput**（別リポジトリの PC 側アプリ）が Firestore に書き込んだ文字起こし結果を、ブラウザから閲覧するための Web ビューアです。サーバー側コードは持たず、Firestore を直接購読する読み取り専用クライアントとして実装します。

詳細仕様は `RBIVoice_plan.md` を参照（このファイルが事実上の設計書であり、実装前に必ず読むこと）。

## 現在の状態

- 実装はまだ存在しない（greenfield）。`pyproject.toml` は残骸であり、実体は **React + Vite + TypeScript** プロジェクトとして `pnpm create vite` から立ち上げる
- `RBIVoice_plan.md` の「開発手順」セクションがプロジェクト初期化の正規手順

## アーキテクチャの要点

横断的に押さえるべき設計判断（個別ファイルだけ読んでも分からない部分）：

- **書き込み禁止クライアント**: Web 側は Firestore に一切書き込まない。`firestore.rules` で `allow write: if false`。送信元は RBIVoiceInput がサービスアカウントでルールをバイパスして書き込む
- **roomId はクエリパラメータ**: `?room={roomId}` で部屋を切り替える。React Router は使わず 1 画面構成。`roomId` 不在時は `RoomGate` でエラー表示
- **データモデル**: `/rooms/{roomId}/segments/{autoId}`（テキスト断片の追記）と `/rooms/{roomId}/meta/state`（録音状態）の 2 系統。`segments` は `expiresAt` フィールドによる Firestore TTL で自動削除（最大 24h 遅延あり）。クライアント側でも `expiresAt < now` でフィルタして遅延を吸収
- **Presence 判定**: `recording` フラグと `lastPing` の差分で「録音中／待機中／切断」を決める。`usePresence` 内で 1 秒ごとに `now` を更新して再評価
- **「クリア」の二系統**: Web 側「クリア」はローカル表示のみ（`hiddenBefore` でフィルタ）。Firestore データを消せるのは PC 側のみ。UI でこの差をツールチップ表示する仕様
- **App Check 必須**: 本番は reCAPTCHA Enterprise、ローカル開発は Debug Token。Firestore コンソールで強制 ON にする

## コマンド

開発・ビルド・デプロイは pnpm + Firebase CLI（プロジェクト初期化後）：

```powershell
pnpm dev                   # ローカル開発サーバ
pnpm build                 # dist/ にビルド
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

## 規約（`.claude/rules/` から）

- **コミットメッセージ**: `✨ feat` / `🐛 fix` / `📝 docs` / `♻️ refactor` / `✅ test` プレフィックス + 日本語で「変更内容と理由」
- **応答スタイル**: 文章ではなくパッチ差分で返す。変更範囲は最小限。修正は直接適用する
- **UI 文言**: すべて日本語。`src/constants.ts` で一元管理し、マジック文字列禁止
- **コメント**: 分かりにくいロジックにのみ日本語で最小限。自明なコードにコメントを付けない
- **コーディング**: KISS 優先・可読性優先。Python を書く場合は PEP8 + 型ヒント必須（ただし本プロジェクトの本体は TypeScript）
