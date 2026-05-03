/**
 * プログレスバーコンポーネント
 * 堕落ゲージなどの進捗表示
 */

import React from 'react';

interface ProgressBarProps {
  value: number; // 現在値
  max: number; // 最大値
  label?: string;
  color?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  color = 'bg-ink-700',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-japanese text-ink-700">{label}</span>
          <span className="text-sm font-japanese text-ink-600">
            {value} / {max}
          </span>
        </div>
      )}
      <div className="w-full h-4 bg-paper-dark rounded-full border-2 border-ink-300 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-xs font-japanese text-ink-500">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
