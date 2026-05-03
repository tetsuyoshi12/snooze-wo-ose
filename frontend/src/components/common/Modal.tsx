/**
 * モーダルコンポーネント
 * 汎用モーダル、オーバーレイ、閉じるボタン
 */

import React, { useEffect } from 'react';
import { ModalProps } from '@/types';

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // ESC キーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // モーダルが開いているときは背景スクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900 bg-opacity-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-paper-light rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-4 border-ink-800 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b-2 border-ink-300">
          {title && <h2 className="text-2xl font-japanese text-ink-900">{title}</h2>}
          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-900 text-3xl leading-none transition-colors"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
