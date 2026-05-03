/**
 * 型定義ファイル
 * component-methods.md の型定義に基づいて作成
 */

/**
 * スヌーズ記録データ
 */
export interface RecordData {
  userId: string;
  timestamp: string; // ISO 8601 形式
  action: 'snooze' | 'dismiss';
  messageId: string;
  pattern: string;
}

/**
 * アラーム設定
 */
export interface AlarmConfig {
  userId: string;
  alarmTime: string; // HH:MM 形式
  isEnabled: boolean;
  snoozeInterval: number; // 分単位
}

/**
 * メッセージコンテキスト（AI メッセージ生成時のオプション情報）
 */
export interface MessageContext {
  date?: string;
  weather?: string;
}

/**
 * デモ用データ
 */
export interface DemoData {
  messages: string[];
  records: RecordData[];
  gauge: number; // 0-100
  consecutiveDays: number;
}

/**
 * AI メッセージ
 */
export interface Message {
  messageId: string;
  pattern: string;
  text: string;
  timestamp: string; // ISO 8601 形式
}

/**
 * API レスポンス: メッセージ生成
 */
export interface MessageGenerateResponse {
  message: string;
  pattern: string;
  messageId?: string;
}

/**
 * API レスポンス: 記録保存
 */
export interface RecordSaveResponse {
  success: boolean;
  error?: string;
}

/**
 * API レスポンス: 記録取得
 */
export interface RecordGetResponse {
  success: boolean;
  records: RecordData[];
  error?: string;
}

/**
 * アラームパターン種別
 */
export type AlarmPattern = 'poetic' | 'seasonal' | 'sophistry' | 'complicit' | 'scientific';

/**
 * デモステップ
 */
export type DemoStep =
  | 'intro'
  | 'alarm-setting'
  | 'alarm-trigger'
  | 'snooze-action'
  | 'dashboard'
  | 'certificate';

/**
 * ボタンサイズ
 */
export type ButtonSize = 'small' | 'medium' | 'large' | 'giant';

/**
 * ボタンバリアント
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * モーダルプロップス（共通）
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * エラーハンドラーオプション
 */
export interface ErrorHandlerOptions {
  timeout?: number; // ミリ秒
  retries?: number;
  fallback?: () => void;
}

/**
 * 同期マネージャーオプション
 */
export interface SyncManagerOptions {
  autoSync?: boolean;
  syncInterval?: number; // ミリ秒
}
