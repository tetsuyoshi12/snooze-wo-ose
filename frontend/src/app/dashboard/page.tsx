'use client';

/**
 * 記録ダッシュボード
 * F-06: 堕落ゲージ表示
 * F-07: 連続二度寝記録
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecord } from '@/contexts/RecordContext';
import Button from '@/components/common/Button';
import ProgressBar from '@/components/common/ProgressBar';
import CertificateModal from '@/components/modals/CertificateModal';

export default function RecordDashboard() {
  const router = useRouter();
  const { records, calculateGauge, getConsecutiveDays, getTotalSnoozeTime, syncRecords } =
    useRecord();
  const [showCertificate, setShowCertificate] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const gauge = calculateGauge();
  const consecutiveDays = getConsecutiveDays();
  const totalSnoozeTime = getTotalSnoozeTime();

  // 30 日達成時に卒業証書を表示
  useEffect(() => {
    if (consecutiveDays >= 30) {
      setShowCertificate(true);
    }
  }, [consecutiveDays]);

  const handleSync = async () => {
    setSyncing(true);
    await syncRecords();
    setSyncing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* タイトル */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-japanese text-ink-900 mb-4">記録ダッシュボード</h2>
        <p className="text-ink-600">あなたの堕落の軌跡</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 堕落ゲージ */}
        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-ink-800">
          <h3 className="text-xl font-japanese text-ink-900 mb-4">堕落ゲージ</h3>
          <ProgressBar value={gauge} max={100} color="bg-red-700" />
          <p className="text-sm text-ink-600 mt-2">直近 30 日のスヌーズ回数に基づく</p>
        </div>

        {/* 連続記録 */}
        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-ink-800">
          <h3 className="text-xl font-japanese text-ink-900 mb-4">連続二度寝記録</h3>
          <div className="text-center">
            <p className="text-6xl font-bold text-ink-900">{consecutiveDays}</p>
            <p className="text-lg text-ink-600 mt-2">日</p>
          </div>
          {consecutiveDays >= 30 && (
            <p className="text-sm text-green-700 mt-2 text-center">🎓 卒業達成！</p>
          )}
        </div>

        {/* 累計スヌーズ時間 */}
        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-ink-800">
          <h3 className="text-xl font-japanese text-ink-900 mb-4">累計スヌーズ時間</h3>
          <div className="text-center">
            <p className="text-6xl font-bold text-ink-900">{totalSnoozeTime}</p>
            <p className="text-lg text-ink-600 mt-2">分</p>
          </div>
          <p className="text-sm text-ink-600 mt-2 text-center">
            = {Math.round(totalSnoozeTime / 60)} 時間
          </p>
        </div>
      </div>

      {/* 記録履歴 */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-ink-800 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-japanese text-ink-900">記録履歴</h3>
          <Button size="small" variant="secondary" onClick={handleSync} loading={syncing}>
            🔄 同期
          </Button>
        </div>

        {records.length === 0 ? (
          <p className="text-center text-ink-600 py-8">まだ記録がありません</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.slice(0, 50).map((record, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-paper-dark rounded border border-ink-300"
              >
                <div>
                  <span className="font-japanese text-ink-800">
                    {new Date(record.timestamp).toLocaleString('ja-JP')}
                  </span>
                  <span className="ml-3 text-sm text-ink-600">({record.pattern})</span>
                </div>
                <span
                  className={`px-3 py-1 rounded ${
                    record.action === 'snooze'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {record.action === 'snooze' ? '💤 スヌーズ' : '✅ 起きた'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ナビゲーション */}
      <div className="text-center">
        <Button variant="secondary" onClick={() => router.push('/')}>
          ← アラーム設定に戻る
        </Button>
      </div>

      {/* 卒業証書モーダル */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        achievementDate={new Date().toISOString()}
      />
    </div>
  );
}
