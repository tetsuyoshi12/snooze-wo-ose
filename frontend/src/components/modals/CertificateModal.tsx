'use client';

/**
 * 卒業証書モーダル
 * 30 日連続達成時に表示
 */

import React from 'react';
import Modal from '@/components/common/Modal';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievementDate: string;
}

export default function CertificateModal({
  isOpen,
  onClose,
  achievementDate,
}: CertificateModalProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-8">
        {/* 和紙風背景 */}
        <div className="bg-paper rounded-lg p-8 border-4 border-ink-800 shadow-2xl">
          <h1 className="text-4xl font-japanese text-ink-900 mb-8">卒業証書</h1>

          <div className="space-y-6 text-ink-800">
            <p className="text-xl font-japanese">
              あなたは 30 日間連続で
              <br />
              二度寝の道を極めました
            </p>

            <div className="my-8">
              <div className="text-6xl">🎓</div>
            </div>

            <p className="text-lg font-japanese">
              達成日: {formatDate(achievementDate)}
            </p>

            <div className="border-t-2 border-ink-300 pt-6 mt-6">
              <p className="text-sm text-ink-600 font-japanese">
                これにて、あなたは堕落の達人として
                <br />
                認定されました
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={onClose}
              className="bg-ink-800 text-paper-light px-8 py-3 rounded-lg font-japanese hover:bg-ink-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>

        <p className="text-xs text-ink-500 mt-4 font-japanese">
          ※ スクリーンショットを撮って記念にどうぞ
        </p>
      </div>
    </Modal>
  );
}
