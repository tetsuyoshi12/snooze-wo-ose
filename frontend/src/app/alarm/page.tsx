'use client';

/**
 * アラーム画面
 * F-02: アラーム鳴動
 * F-03: AI メッセージ生成
 * F-04: 巨大スヌーズ UI
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAlarm } from '@/contexts/AlarmContext';
import { useRecord } from '@/contexts/RecordContext';
import Button from '@/components/common/Button';
import { generateMessage } from '@/lib/api-client';
import { AlarmPattern } from '@/types';
import { showNotification } from '@/lib/alarm-manager';
import { FALLBACK_MESSAGES } from '@/constants/fallback-messages';

export default function AlarmScreen() {
  const router = useRouter();
  const { alarmConfig, snooze, dismiss } = useAlarm();
  const { addRecord } = useRecord();
  const [message, setMessage] = useState<string>('');
  const [pattern, setPattern] = useState<AlarmPattern>('poetic');
  const [loading, setLoading] = useState(true);

  // AI メッセージを生成
  useEffect(() => {
    const patterns: AlarmPattern[] = ['poetic', 'seasonal', 'sophistry', 'complicit', 'scientific'];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    setPattern(randomPattern);

    generateMessage(randomPattern)
      .then((msg) => {
        setMessage(msg);
        setLoading(false);
      })
      .catch((error) => {
        // API 失敗時はフォールバックメッセージを使用（F-03 受入基準）
        console.error('Failed to generate message, using fallback:', error);
        setMessage(FALLBACK_MESSAGES[randomPattern]);
        setLoading(false);
      });

    // 通知を表示
    showNotification('スヌーズを押せ', 'アラームが鳴りました');
  }, []);

  const handleSnooze = async () => {
    try {
      // 記録を保存
      await addRecord({
        userId: alarmConfig?.userId || 'user_local_001',
        timestamp: new Date().toISOString(),
        action: 'snooze',
        messageId: `msg_${Date.now()}`,
        pattern,
      });
    } catch (error) {
      // 記録保存に失敗してもスヌーズ処理は続行
      console.error('Failed to save snooze record:', error);
    }

    // スヌーズ処理
    snooze();

    // トップページに戻る
    router.push('/');
  };

  const handleDismiss = async () => {
    try {
      // 記録を保存
      await addRecord({
        userId: alarmConfig?.userId || 'user_local_001',
        timestamp: new Date().toISOString(),
        action: 'dismiss',
        messageId: `msg_${Date.now()}`,
        pattern,
      });
    } catch (error) {
      // 記録保存に失敗してもアラーム停止処理は続行
      console.error('Failed to save dismiss record:', error);
    }

    // アラームを停止
    dismiss();

    // トップページに戻る
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-900 to-ink-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* 墨絵風背景 */}
        <div className="bg-paper rounded-lg p-12 border-4 border-ink-800 shadow-2xl text-center">
          {/* タイトル */}
          <h1 className="text-5xl font-japanese text-ink-900 mb-8">おはようございます</h1>

          {/* AI メッセージ */}
          <div className="bg-white rounded-lg p-8 border-2 border-ink-300 mb-12 min-h-[150px] flex items-center justify-center">
            {loading ? (
              <p className="text-xl text-ink-600 animate-pulse">メッセージを生成中...</p>
            ) : (
              <p className="text-2xl font-japanese text-ink-800 leading-relaxed">{message}</p>
            )}
          </div>

          {/* ボタン */}
          <div className="space-y-6">
            {/* 巨大スヌーズボタン */}
            <Button
              size="giant"
              variant="primary"
              onClick={handleSnooze}
              disabled={loading}
              className="w-full shadow-2xl hover:scale-105 transform transition-transform"
            >
              💤 スヌーズ
            </Button>

            {/* 小さい起きるボタン */}
            <Button
              size="small"
              variant="ghost"
              onClick={handleDismiss}
              disabled={loading}
              className="w-full opacity-50 hover:opacity-100"
            >
              起きる
            </Button>
          </div>

          {/* パターン表示 */}
          <p className="text-sm text-ink-500 mt-6">パターン: {pattern}</p>
        </div>
      </div>
    </div>
  );
}
