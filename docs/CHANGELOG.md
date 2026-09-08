# 変更履歴

このプロジェクトのすべての重要な変更は、このファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づいており、
バージョン番号は [Semantic Versioning](https://semver.org/lang/ja/) に従っています。

## [Unreleased]

## [1.0.1] - 2026-09-08

### 追加
- `useNow` フック: App コンポーネント内でのタイマー処理を整理し、時刻を一元管理
- `activeText` 関数: トランスクリプト テキストのアクティブ状態判定
- `FEEDBACK_DURATION_MS` 定数: ユーザーフィードバック表示時間を設定可能に
- クリア成功メッセージ: テキストクリア実行時にユーザーにフィードバック表示

### 変更
- ToolBar ボタン共通化とタイマー修正: ボタン処理の統一化により保守性向上
- TranscriptView プレースホルダー表示簡略化: UI をより直感的に
- PresenceBadge スタイル改善: ビジュアルの洗練
- `usePresence` フック: 時刻を引数で受け取るよう変更（テスト性・再利用性向上）
- Firestore rules: transcript 更新ルールを厳格化（セキュリティ強化）
- App コンポーネント: タイマー処理を useNow フックで整理

### 修正
- 型チェック強化: useTranscript・usePresence で Timestamp の型チェック追加
- コードレビュー結果を反映した不具合修正
- PresenceStatus インポート元最適化
- vitest 設定改善: defineConfig インポート追加

## [1.0.0] - 2026-05-06
- RBIVoice の初版リリース
