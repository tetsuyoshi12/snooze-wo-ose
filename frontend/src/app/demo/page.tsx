'use client';

/**
 * デモシナリオページ
 * F-08: デモ用ライブモード
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/contexts/DemoContext';
import Button from '@/components/common/Button';

export default function DemoScenario() {
  const router = useRouter();
  const { isDemoMode, currentStep, demoData, nextStep, exitDemo } = useDemo();

  // デモモードでない場合はトップページに戻る
  useEffect(() => {
    if (!isDemoMode) {
      router.push('/');
    }
  }, [isDemoMode, router]);

  // 自動進行（各ステップ 10 秒）
  useEffect(() => {
    if (currentStep !== 'intro' && currentStep !== 'certificate') {
      const timer = setTimeout(() => {
        nextStep();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, nextStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="text-center">
            <h1 className="text-5xl font-japanese text-ink-900 mb-8">
              デモシナリオへようこそ
            </h1>
            <p className="text-xl text-ink-700 mb-12">
              これから 90 秒で「スヌーズを押せ」の機能をご紹介します
            </p>
            <Button size="large" variant="primary" onClick={nextStep}>
              デモを開始
            </Button>
          </div>
        );

      case 'alarm-setting':
        return (
          <div className="text-center">
            <h2 className="text-4xl font-japanese text-ink-900 mb-8">
              ステップ 1: アラーム設定
            </h2>
            <div className="bg-white rounded-lg p-8 border-4 border-ink-800 max-w-2xl mx-auto">
              <p className="text-xl text-ink-700 mb-6">
                アラーム時刻とスヌーズ間隔を設定します
              </p>
              <div className="text-6xl mb-4">⏰</div>
              <p className="text-lg text-ink-600">デモでは 07:00 に設定されています</p>
            </div>
          </div>
        );

      case 'alarm-trigger':
        return (
          <div className="text-center">
            <h2 className="text-4xl font-japanese text-ink-900 mb-8">
              ステップ 2: アラーム鳴動
            </h2>
            <div className="bg-paper rounded-lg p-8 border-4 border-ink-800 max-w-2xl mx-auto">
              <p className="text-2xl font-japanese text-ink-800 mb-6">
                {demoData.messages[0]}
              </p>
              <div className="text-6xl mb-4">💤</div>
              <p className="text-lg text-ink-600">
                AI が詩的に二度寝を勧めるメッセージを生成します
              </p>
            </div>
          </div>
        );

      case 'snooze-action':
        return (
          <div className="text-center">
            <h2 className="text-4xl font-japanese text-ink-900 mb-8">
              ステップ 3: スヌーズアクション
            </h2>
            <div className="bg-white rounded-lg p-8 border-4 border-ink-800 max-w-2xl mx-auto">
              <p className="text-xl text-ink-700 mb-6">巨大なスヌーズボタンを押します</p>
              <Button size="giant" variant="primary" className="mb-6">
                💤 スヌーズ
              </Button>
              <p className="text-lg text-ink-600">
                記録が保存され、設定した間隔後に再度アラームが鳴ります
              </p>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="text-center">
            <h2 className="text-4xl font-japanese text-ink-900 mb-8">
              ステップ 4: 記録ダッシュボード
            </h2>
            <div className="bg-white rounded-lg p-8 border-4 border-ink-800 max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-ink-600">堕落ゲージ</p>
                  <p className="text-4xl font-bold text-red-700">{demoData.gauge}%</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600">連続記録</p>
                  <p className="text-4xl font-bold text-ink-900">{demoData.consecutiveDays}日</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600">累計時間</p>
                  <p className="text-4xl font-bold text-ink-900">
                    {demoData.records.length * 10}分
                  </p>
                </div>
              </div>
              <p className="text-lg text-ink-600">
                あなたの堕落の軌跡を可視化します
              </p>
            </div>
          </div>
        );

      case 'certificate':
        return (
          <div className="text-center">
            <h2 className="text-4xl font-japanese text-ink-900 mb-8">
              ステップ 5: 卒業証書
            </h2>
            <div className="bg-paper rounded-lg p-8 border-4 border-ink-800 max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🎓</div>
              <p className="text-2xl font-japanese text-ink-800 mb-6">
                30 日連続達成で卒業証書が授与されます
              </p>
              <p className="text-lg text-ink-600 mb-8">
                あなたは堕落の達人として認定されます
              </p>
              <Button size="large" variant="primary" onClick={exitDemo}>
                デモを終了
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-paper-light to-paper-dark flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {renderStep()}

        {/* 進行状況 */}
        {currentStep !== 'intro' && currentStep !== 'certificate' && (
          <div className="text-center mt-8">
            <p className="text-sm text-ink-600">
              自動的に次のステップに進みます...
            </p>
            <Button size="small" variant="ghost" onClick={exitDemo} className="mt-4">
              デモを終了
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
