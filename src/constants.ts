export const UI_TEXT = {
  appTitle: 'RBIVoice',
  roomLabel: 'ユーザーID',
  presenceRecording: '音声入力中',
  presenceIdle: '待機中',
  presenceDisconnected: '切断',
  copyButton: 'コピー',
  removeLineBreaksButton: '改行除去',
  removeLineBreaksTooltip: '表示中のテキストから改行をすべて除去します',
  clearButton: 'クリア',
  saveButton: '保存',
  copySuccess: 'コピーしました',
  copyFailure: 'コピーに失敗しました',
  saveSuccess: '保存しました',
  saveFailure: '保存に失敗しました',
  clearFailure: 'クリアに失敗しました',
  clearTooltip: 'この部屋の文字起こしを即時に消去します（音声入力中は実行不可）',
  copyTooltip: '表示中のテキスト全文をクリップボードにコピーします',
  saveTooltip: '編集内容を保存します（音声入力中は実行不可）',
  editDisabledHint: '音声入力中は編集できません',
  roomGateTitle: '部屋が指定されていません',
  roomGateDescription: 'URL に「?room=ユーザーID」を指定してください',
  roomGateExample: '例: https://example.com/?room=tanaka-pc',
  emptyTranscript: '（まだ文字起こしはありません）',
  autoDeleteNotice: '患者ID・氏名・住所などの個人情報は入力しないでください 文字起こし結果は一定時間後に自動消去されます',
} as const;

export const PRESENCE_TIMEOUT_MS = 30 * 1000;
export const PRESENCE_TICK_MS = 1000;
export const TRANSCRIPT_TTL_MS = 10 * 60 * 1000;
