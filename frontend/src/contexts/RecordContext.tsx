'use client';

/**
 * 記録コンテキスト
 * スヌーズ記録を管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecordData } from '@/types';
import { saveRecordsLocal, loadRecordsLocal, syncWithDynamoDB } from '@/lib/sync-manager';
import { saveRecord as saveRecordAPI } from '@/lib/api-client';

interface RecordContextType {
  records: RecordData[];
  addRecord: (record: RecordData) => Promise<void>;
  syncRecords: () => Promise<void>;
  calculateGauge: () => number;
  getConsecutiveDays: () => number;
  getTotalSnoozeTime: () => number;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export function RecordProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<RecordData[]>([]);

  // 初期化: ローカルストレージから記録を読み込み
  useEffect(() => {
    const localRecords = loadRecordsLocal();
    setRecords(localRecords);
  }, []);

  const addRecord = async (record: RecordData) => {
    // ローカルに追加
    const newRecords = [record, ...records];
    setRecords(newRecords);
    saveRecordsLocal(newRecords);

    // API に送信（バックグラウンド）
    try {
      await saveRecordAPI(record);
    } catch (error) {
      console.error('Failed to save record to API:', error);
      // ローカルには保存済みなので、エラーは無視
    }
  };

  const syncRecords = async () => {
    const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || '';
    const userId = 'user_local_001'; // ローカルユーザー ID
    const syncedRecords = await syncWithDynamoDB(apiEndpoint, userId);
    setRecords(syncedRecords);
  };

  const calculateGauge = (): number => {
    // 堕落ゲージ計算: 直近 30 日のスヌーズ回数に基づく
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSnoozes = records.filter(
      (r) => r.action === 'snooze' && new Date(r.timestamp) >= thirtyDaysAgo
    );

    // 30 日で 30 回スヌーズ = 100%
    const gauge = Math.min((recentSnoozes.length / 30) * 100, 100);
    return Math.round(gauge);
  };

  const getConsecutiveDays = (): number => {
    // 連続二度寝日数を計算
    if (records.length === 0) return 0;

    const sortedRecords = [...records].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let consecutiveDays = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const record of sortedRecords) {
      if (record.action !== 'snooze') continue;

      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === consecutiveDays) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  };

  const getTotalSnoozeTime = (): number => {
    // 累計スヌーズ時間（分単位）
    // 1 回のスヌーズ = 10 分と仮定
    const snoozeCount = records.filter((r) => r.action === 'snooze').length;
    return snoozeCount * 10;
  };

  return (
    <RecordContext.Provider
      value={{
        records,
        addRecord,
        syncRecords,
        calculateGauge,
        getConsecutiveDays,
        getTotalSnoozeTime,
      }}
    >
      {children}
    </RecordContext.Provider>
  );
}

export function useRecord() {
  const context = useContext(RecordContext);
  if (!context) {
    throw new Error('useRecord must be used within RecordProvider');
  }
  return context;
}
