/**
 * 同期マネージャー
 * ローカルストレージと DynamoDB の同期を管理
 */

import { RecordData, SyncManagerOptions } from '@/types';
import { logError } from './error-handler';

const STORAGE_KEYS = {
  RECORDS: 'snooze_records',
  ALARM_CONFIG: 'alarm_config',
  LAST_SYNC: 'last_sync',
};

/**
 * ローカルストレージに保存
 */
export function saveToLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), 'saveToLocal');
  }
}

/**
 * ローカルストレージから読み込み
 */
export function loadFromLocal<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), 'loadFromLocal');
    return null;
  }
}

/**
 * ローカルストレージから削除
 */
export function removeFromLocal(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), 'removeFromLocal');
  }
}

/**
 * 記録をローカルに保存
 */
export function saveRecordsLocal(records: RecordData[]): void {
  saveToLocal(STORAGE_KEYS.RECORDS, records);
}

/**
 * 記録をローカルから読み込み
 */
export function loadRecordsLocal(): RecordData[] {
  return loadFromLocal<RecordData[]>(STORAGE_KEYS.RECORDS) || [];
}

/**
 * DynamoDB と同期
 * オンライン復帰時に全データを上書き（シンプルな同期戦略）
 */
export async function syncWithDynamoDB(
  apiEndpoint: string,
  userId: string
): Promise<RecordData[]> {
  try {
    // ローカルの記録を取得
    const localRecords = loadRecordsLocal();

    // DynamoDB から記録を取得
    const response = await fetch(`${apiEndpoint}/record/get?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch records from DynamoDB');
    }

    const data = await response.json();
    const remoteRecords: RecordData[] = data.records || [];

    // ローカルとリモートをマージ（タイムスタンプでソート）
    const allRecords = [...localRecords, ...remoteRecords];
    const uniqueRecords = Array.from(
      new Map(allRecords.map((r) => [r.timestamp, r])).values()
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ローカルに保存
    saveRecordsLocal(uniqueRecords);

    // 最終同期時刻を記録
    saveToLocal(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    return uniqueRecords;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), 'syncWithDynamoDB');
    // 同期失敗時はローカルデータを返す
    return loadRecordsLocal();
  }
}

/**
 * 最終同期時刻を取得
 */
export function getLastSyncTime(): string | null {
  return loadFromLocal<string>(STORAGE_KEYS.LAST_SYNC);
}

/**
 * オンライン状態を確認
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * オンライン復帰時の自動同期を設定
 */
export function setupAutoSync(
  apiEndpoint: string,
  userId: string,
  options: SyncManagerOptions = {}
): () => void {
  const { autoSync = true } = options;

  if (!autoSync) {
    return () => {}; // 何もしない cleanup 関数
  }

  const handleOnline = () => {
    console.log('Online detected, syncing...');
    syncWithDynamoDB(apiEndpoint, userId);
  };

  window.addEventListener('online', handleOnline);

  // cleanup 関数を返す
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
