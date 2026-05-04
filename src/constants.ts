export const UI_TEXT = {
  appTitle: 'RBIVoice',
  roomLabel: 'ユーザーID',
  presenceRecording: '音声入力中',
  presenceIdle: '待機中',
  presenceDisconnected: '切断',
  copyButton: 'コピー',
  clearButton: 'クリア',
  copySuccess: 'コピーしました',
  copyFailure: 'コピーに失敗しました',
  clearTooltip: 'ローカル表示のみクリアします。Firestore のデータは PC 側からのみ削除できます。',
  copyTooltip: '表示中のテキスト全文をクリップボードにコピーします。',
  roomGateTitle: '部屋が指定されていません',
  roomGateDescription: 'URL に「?room=ユーザーID」を指定してください。',
  roomGateExample: '例: https://example.com/?room=tanaka-pc',
  emptyTranscript: '（まだ文字起こしはありません）',
} as const;

export const PRESENCE_TIMEOUT_MS = 30 * 1000;
export const SEGMENT_TTL_MS = 10 * 60 * 1000;
export const SEGMENT_LIMIT = 500;
export const PRESENCE_TICK_MS = 1000;
