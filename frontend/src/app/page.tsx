'use client';

/**
 * トップページ（アラーム設定ページ）
 * F-01: アラーム時刻設定
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAlarm } from '@/contexts/AlarmContext';
import { useDemo } from '@/contexts/DemoContext';
import Button from '@/components/common/Button';
import { requestNotificationPermission } from '@/lib/alarm-manager';

export default function AlarmSettingPage() {
  const router = useRouter();
  const { alarmConfig, setAlarmTime, toggleAlarm, setSnoozeInterval, isAlarmActive } =
    useAlarm();
  const { startDemo } = useDemo();

  // アラームが鳴動したらアラーム画面に遷移
  useEffect(() => {
    if (isAlarmActive) {
      router.push('/alarm');
    }
  }, [isAlarmActive, router]);

  // 通知権限をリクエスト
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (!alarmConfig) {
    return <div className="text-center py-12">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* タイトル */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-japanese text-ink-900 mb-4">アラーム設定</h2>
        <p className="text-ink-600">AI があなたの二度寝を応援します</p>
      </div>

      {/* アラーム設定カード */}
      <div className="bg-white rounded-lg shadow-xl p-8 border-4 border-ink-800 mb-8">
        {/* アラーム時刻 */}
        <div className="mb-6">
          <label className="block text-lg font-japanese text-ink-800 mb-2">
            アラーム時刻
          </label>
          <input
            type="time"
            value={alarmConfig.alarmTime}
            onChange={(e) => setAlarmTime(e.target.value)}
            className="w-full px-4 py-3 text-2xl border-2 border-ink-400 rounded-lg focus:outline-none focus:border-ink-700"
          />
        </div>

        {/* スヌーズ間隔 */}
        <div className="mb-6">
          <label className="block text-lg font-japanese text-ink-800 mb-2">
            スヌーズ間隔（分）
          </label>
          <input
            type="number"
            value={alarmConfig.snoozeInterval}
            onChange={(e) => setSnoozeInterval(Number(e.target.value))}
            min="1"
            max="60"
            className="w-full px-4 py-3 text-xl border-2 border-ink-400 rounded-lg focus:outline-none focus:border-ink-700"
          />
        </div>

        {/* アラーム有効/無効 */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alarmConfig.isEnabled}
              onChange={(e) => toggleAlarm(e.target.checked)}
              className="w-6 h-6 mr-3"
            />
            <span className="text-lg font-japanese text-ink-800">アラームを有効にする</span>
          </label>
        </div>

        {/* 状態表示 */}
        <div className="bg-paper-dark rounded-lg p-4 border-2 border-ink-300">
          <p className="text-ink-700 font-japanese">
            {alarmConfig.isEnabled
              ? `✅ アラームは ${alarmConfig.alarmTime} に鳴ります`
              : '⏸️ アラームは無効です'}
          </p>
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard')}
          className="w-full"
        >
          📊 記録を見る
        </Button>
        <Button variant="primary" onClick={startDemo} className="w-full">
          🎬 デモを見る
        </Button>
      </div>

      {/* 説明 */}
      <div className="bg-ink-100 rounded-lg p-6 border-2 border-ink-300">
        <h3 className="text-xl font-japanese text-ink-900 mb-3">使い方</h3>
        <ol className="list-decimal list-inside space-y-2 text-ink-700">
          <li>アラーム時刻を設定してください</li>
          <li>「アラームを有効にする」をチェックしてください</li>
          <li>設定した時刻になると、AI が二度寝を勧めるメッセージを表示します</li>
          <li>巨大な「スヌーズ」ボタンを押して、もう少し寝ましょう</li>
          <li>記録ダッシュボードで、あなたの堕落度を確認できます</li>
        </ol>
      </div>
    </div>
  );
}
