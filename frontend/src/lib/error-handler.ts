/**
 * エラーハンドラー
 * タイムアウト、リトライ、フォールバック処理を提供
 */

import { ErrorHandlerOptions } from '@/types';
import { ERROR_MESSAGES } from '@/constants/fallback-messages';

/**
 * タイムアウト付き fetch
 * AbortController を使用してタイムアウトを実装
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  // AbortController でタイムアウトを実装
  // fetch API の標準機能を使用し、追加ライブラリ不要
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
    }
    throw error;
  }
}

/**
 * リトライ付き非同期関数実行
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T> {
  const { retries = 3, fallback } = options;
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Retry ${i + 1}/${retries} failed:`, lastError.message);

      // 最後のリトライでない場合は待機
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // すべてのリトライが失敗した場合
  if (fallback) {
    console.error('All retries failed, executing fallback');
    fallback();
  }

  throw lastError || new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
}

/**
 * エラーログ記録
 */
export function logError(error: Error, context?: string): void {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${context ? `[${context}] ` : ''}${error.message}`;
  console.error(message, error);

  // 将来的には外部ログサービスに送信可能
  // 例: Sentry, CloudWatch Logs など
}

/**
 * グローバルエラーハンドラー
 */
export function handleGlobalError(error: Error): void {
  logError(error, 'Global');
  // ユーザーにエラーを通知（トースト通知など）
  // 現時点では console.error のみ
}
