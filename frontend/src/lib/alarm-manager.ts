/**
 * アラームマネージャー
 * アラーム機能の中核ロジックを管理
 */

import { AlarmConfig } from '@/types';
import { saveToLocal, loadFromLocal } from './sync-manager';

const ALARM_CONFIG_KEY = 'alarm_config';

/**
 * アラーム設定を保存
 */
export function saveAlarmConfig(config: AlarmConfig): void {
  saveToLocal(ALARM_CONFIG_KEY, config);
}

/**
 * アラーム設定を読み込み
 */
export function loadAlarmConfig(): AlarmConfig | null {
  return loadFromLocal<AlarmConfig>(ALARM_CONFIG_KEY);
}

/**
 * アラームをスケジュール
 * setTimeout を使用してアラームを設定
 */
export function scheduleAlarm(
  alarmTime: string,
  onTrigger: () => void
): NodeJS.Timeout | null {
  try {
    const [hours, minutes] = alarmTime.split(':').map(Number);
    const now = new Date();
    const alarm = new Date();
    alarm.setHours(hours, minutes, 0, 0);

    // アラーム時刻が過去の場合は翌日に設定
    if (alarm <= now) {
      alarm.setDate(alarm.getDate() + 1);
    }

    const delay = alarm.getTime() - now.getTime();
    console.log(`Alarm scheduled in ${Math.round(delay / 1000 / 60)} minutes`);

    return setTimeout(onTrigger, delay);
  } catch (error) {
    console.error('Failed to schedule alarm:', error);
    return null;
  }
}

/**
 * アラームをキャンセル
 */
export function cancelAlarm(timerId: NodeJS.Timeout | null): void {
  if (timerId) {
    clearTimeout(timerId);
  }
}

/**
 * スヌーズ処理
 * 指定された分数後に再度アラームを鳴らす
 */
export function scheduleSnooze(
  snoozeMinutes: number,
  onTrigger: () => void
): NodeJS.Timeout {
  const delay = snoozeMinutes * 60 * 1000;
  console.log(`Snooze scheduled in ${snoozeMinutes} minutes`);
  return setTimeout(onTrigger, delay);
}

/**
 * Web Notifications API の権限をリクエスト
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * 通知を表示
 */
export function showNotification(title: string, body: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon.png', // 将来的にアイコンを追加
      requireInteraction: true, // ユーザーが閉じるまで表示
    });
  }
}

/**
 * アラーム音を再生（将来的な拡張用）
 */
export function playAlarmSound(): void {
  // 将来的に音声ファイルを再生
  // 現時点では通知のみ
  console.log('Alarm sound would play here');
}
