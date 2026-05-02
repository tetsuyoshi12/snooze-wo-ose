'use client';

/**
 * アラームコンテキスト
 * アラーム設定とアラーム状態を管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AlarmConfig } from '@/types';
import {
  saveAlarmConfig,
  loadAlarmConfig,
  scheduleAlarm,
  cancelAlarm,
  scheduleSnooze,
} from '@/lib/alarm-manager';

interface AlarmContextType {
  alarmConfig: AlarmConfig | null;
  isAlarmActive: boolean;
  setAlarmTime: (time: string) => void;
  toggleAlarm: (enabled: boolean) => void;
  setSnoozeInterval: (minutes: number) => void;
  triggerAlarm: () => void;
  snooze: () => void;
  dismiss: () => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [alarmConfig, setAlarmConfig] = useState<AlarmConfig | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // 初期化: ローカルストレージから設定を読み込み
  useEffect(() => {
    const config = loadAlarmConfig();
    if (config) {
      setAlarmConfig(config);
    } else {
      // デフォルト設定
      const defaultConfig: AlarmConfig = {
        userId: 'user_local_001', // ローカルユーザー ID
        alarmTime: '07:00',
        isEnabled: false,
        snoozeInterval: 10,
      };
      setAlarmConfig(defaultConfig);
      saveAlarmConfig(defaultConfig);
    }
  }, []);

  // アラームが有効な場合、スケジュール
  useEffect(() => {
    if (alarmConfig?.isEnabled && alarmConfig.alarmTime) {
      const id = scheduleAlarm(alarmConfig.alarmTime, triggerAlarm);
      setTimerId(id);

      return () => {
        if (id) cancelAlarm(id);
      };
    } else {
      if (timerId) {
        cancelAlarm(timerId);
        setTimerId(null);
      }
    }
  }, [alarmConfig?.isEnabled, alarmConfig?.alarmTime]);

  const setAlarmTime = (time: string) => {
    if (!alarmConfig) return;
    const newConfig = { ...alarmConfig, alarmTime: time };
    setAlarmConfig(newConfig);
    saveAlarmConfig(newConfig);
  };

  const toggleAlarm = (enabled: boolean) => {
    if (!alarmConfig) return;
    const newConfig = { ...alarmConfig, isEnabled: enabled };
    setAlarmConfig(newConfig);
    saveAlarmConfig(newConfig);
  };

  const setSnoozeInterval = (minutes: number) => {
    if (!alarmConfig) return;
    const newConfig = { ...alarmConfig, snoozeInterval: minutes };
    setAlarmConfig(newConfig);
    saveAlarmConfig(newConfig);
  };

  const triggerAlarm = () => {
    setIsAlarmActive(true);
  };

  const snooze = () => {
    setIsAlarmActive(false);
    if (alarmConfig) {
      const id = scheduleSnooze(alarmConfig.snoozeInterval, triggerAlarm);
      setTimerId(id);
    }
  };

  const dismiss = () => {
    setIsAlarmActive(false);
    if (timerId) {
      cancelAlarm(timerId);
      setTimerId(null);
    }
  };

  return (
    <AlarmContext.Provider
      value={{
        alarmConfig,
        isAlarmActive,
        setAlarmTime,
        toggleAlarm,
        setSnoozeInterval,
        triggerAlarm,
        snooze,
        dismiss,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm must be used within AlarmProvider');
  }
  return context;
}
