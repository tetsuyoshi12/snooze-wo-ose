'use client';

/**
 * デモコンテキスト
 * デモモードの状態を管理
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DemoStep, DemoData } from '@/types';

interface DemoContextType {
  isDemoMode: boolean;
  currentStep: DemoStep;
  demoData: DemoData;
  startDemo: () => void;
  nextStep: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// デモ用の事前データ
const DEMO_DATA: DemoData = {
  messages: [
    '朝露に濡れる花のように、もう少しだけ夢の中で揺蕩いませんか。',
    '春眠暁を覚えず、と申します。今日は特に心地よい朝ですね。',
    '統計的に、あと10分寝た方が生産性が向上するというデータがあります。',
  ],
  records: [
    {
      userId: 'demo_user',
      timestamp: '2026-05-01T07:00:00Z',
      action: 'snooze',
      messageId: 'demo_msg_001',
      pattern: 'poetic',
    },
    {
      userId: 'demo_user',
      timestamp: '2026-05-02T07:00:00Z',
      action: 'snooze',
      messageId: 'demo_msg_002',
      pattern: 'seasonal',
    },
    {
      userId: 'demo_user',
      timestamp: '2026-05-03T07:00:00Z',
      action: 'snooze',
      messageId: 'demo_msg_003',
      pattern: 'sophistry',
    },
  ],
  gauge: 75,
  consecutiveDays: 3,
};

const DEMO_STEPS: DemoStep[] = [
  'intro',
  'alarm-setting',
  'alarm-trigger',
  'snooze-action',
  'dashboard',
  'certificate',
];

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentStep, setCurrentStep] = useState<DemoStep>('intro');
  const [demoData] = useState<DemoData>(DEMO_DATA);

  const startDemo = () => {
    setIsDemoMode(true);
    setCurrentStep('intro');
  };

  const nextStep = () => {
    const currentIndex = DEMO_STEPS.indexOf(currentStep);
    if (currentIndex < DEMO_STEPS.length - 1) {
      setCurrentStep(DEMO_STEPS[currentIndex + 1]);
    } else {
      exitDemo();
    }
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    setCurrentStep('intro');
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        currentStep,
        demoData,
        startDemo,
        nextStep,
        exitDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
}
