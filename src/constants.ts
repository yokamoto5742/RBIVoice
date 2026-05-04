export const UI_TEXT = {
  appTitle: 'RBIVoice',
  roomLabel: 'ユーザーID',
  presenceRecording: '音声入力中',
  presenceIdle: '待機中',
  presenceDisconnected: '切断',
  copyButton: 'コピー',
  clearButton: 'クリア',
  saveButton: '保存',
  copySuccess: 'コピーしました',
  copyFailure: 'コピーに失敗しました',
  saveSuccess: '保存しました',
  saveFailure: '保存に失敗しました',
  clearFailure: 'クリアに失敗しました',
  clearTooltip: 'この部屋の文字起こしを即時に消去します（待機中のみ実行可能）',
  copyTooltip: '表示中のテキスト全文をクリップボードにコピーします',
  saveTooltip: '編集内容を保存します（待機中のみ実行可能）',
  editDisabledHint: '編集は待機中のみ可能です',
  roomGateTitle: '部屋が指定されていません',
  roomGateDescription: 'URL に「?room=ユーザーID」を指定してください',
  roomGateExample: '例: https://example.com/?room=tanaka-pc',
  emptyTranscript: '（まだ文字起こしはありません）',
} as const;

export const PRESENCE_TIMEOUT_MS = 30 * 1000;
export const PRESENCE_TICK_MS = 1000;
export const TRANSCRIPT_TTL_MS = 10 * 60 * 1000;
