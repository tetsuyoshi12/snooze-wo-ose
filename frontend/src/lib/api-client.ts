/**
 * API クライアント
 * API Gateway との通信を管理
 */

import {
  MessageGenerateResponse,
  RecordSaveResponse,
  RecordGetResponse,
  RecordData,
  AlarmPattern,
} from '@/types';
import { fetchWithTimeout, retryAsync } from './error-handler';
import { FALLBACK_MESSAGES, DEFAULT_FALLBACK_MESSAGE } from '@/constants/fallback-messages';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '';

/**
 * AI メッセージを生成
 */
export async function generateMessage(pattern: AlarmPattern): Promise<string> {
  try {
    const response = await retryAsync(
      () =>
        fetchWithTimeout(
          `${API_ENDPOINT}/message/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pattern }),
          },
          10000 // 10秒タイムアウト
        ),
      { retries: 2 }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: MessageGenerateResponse = await response.json();
    return data.message;
  } catch (error) {
    console.error('Failed to generate message, using fallback:', error);
    // フォールバックメッセージを返す
    return FALLBACK_MESSAGES[pattern] || DEFAULT_FALLBACK_MESSAGE;
  }
}

/**
 * 記録を保存
 */
export async function saveRecord(record: RecordData): Promise<boolean> {
  try {
    const response = await retryAsync(
      () =>
        fetchWithTimeout(
          `${API_ENDPOINT}/record/save`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
          },
          10000
        ),
      { retries: 2 }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: RecordSaveResponse = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to save record:', error);
    return false;
  }
}

/**
 * 記録を取得
 */
export async function getRecords(userId: string): Promise<RecordData[]> {
  try {
    const response = await retryAsync(
      () =>
        fetchWithTimeout(`${API_ENDPOINT}/record/get?userId=${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }),
      { retries: 2 }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: RecordGetResponse = await response.json();
    return data.records || [];
  } catch (error) {
    console.error('Failed to get records:', error);
    return [];
  }
}
