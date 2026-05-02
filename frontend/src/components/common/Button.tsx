/**
 * ボタンコンポーネント
 * 墨絵風のデザイン、サイズバリエーション
 */

import React from 'react';
import { ButtonSize, ButtonVariant } from '@/types';

interface ButtonProps {
  size?: ButtonSize;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  size = 'medium',
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
}: ButtonProps) {
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
    giant: 'px-16 py-8 text-3xl', // 巨大スヌーズボタン用
  };

  const variantClasses = {
    primary: 'bg-ink-800 text-paper-light hover:bg-ink-700 border-ink-900',
    secondary: 'bg-paper-dark text-ink-800 hover:bg-paper border-ink-400',
    danger: 'bg-red-700 text-white hover:bg-red-600 border-red-900',
    ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 border-ink-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        border-2
        rounded-lg
        font-japanese
        transition-all
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${loading ? 'cursor-wait' : ''}
        ${className}
      `}
    >
      {loading ? '処理中...' : children}
    </button>
  );
}
