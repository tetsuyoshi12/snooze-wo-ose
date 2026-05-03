/**
 * フォールバックメッセージ定数
 * Bedrock API が失敗した場合に使用する定数メッセージ
 */

export const FALLBACK_MESSAGES: Record<string, string> = {
  poetic: '朝露に濡れる花のように、もう少しだけ夢の中で揺蕩いませんか。',
  seasonal: '春眠暁を覚えず、と申します。今日は特に心地よい朝ですね。',
  sophistry: '統計的に、あと10分寝た方が生産性が向上するというデータがあります。',
  complicit: '私も眠いです。一緒にもう少しだけ、ね？',
  scientific: '睡眠不足は認知機能を低下させます。十分な睡眠を確保しましょう。',
};

/**
 * デフォルトのフォールバックメッセージ
 */
export const DEFAULT_FALLBACK_MESSAGE =
  'もう少しだけ、ゆっくり休んでいきませんか。';

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました。',
  API_ERROR: 'API エラーが発生しました。',
  TIMEOUT_ERROR: 'タイムアウトしました。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
};

/**
 * 成功メッセージ
 */
export const SUCCESS_MESSAGES = {
  ALARM_SET: 'アラームを設定しました。',
  RECORD_SAVED: '記録を保存しました。',
  SYNC_COMPLETE: '同期が完了しました。',
};
