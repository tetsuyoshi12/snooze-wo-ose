/**
 * ルートレイアウト
 * アプリケーション全体のレイアウトと Context Provider
 */

import type { Metadata } from 'next';
import './globals.css';
import { AlarmProvider } from '@/contexts/AlarmContext';
import { RecordProvider } from '@/contexts/RecordContext';
import { DemoProvider } from '@/contexts/DemoContext';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'スヌーズを押せ - 朝起きられない人を生産するサービス',
  description: 'AI が二度寝を勧める目覚ましアプリ。AWS Summit Japan 2026 ハッカソン作品',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-paper-light font-japanese">
        <ErrorBoundary>
          <AlarmProvider>
            <RecordProvider>
              <DemoProvider>
                <div className="min-h-screen">
                  {/* ヘッダー */}
                  <header className="bg-ink-900 text-paper-light py-4 px-6 border-b-4 border-ink-800">
                    <h1 className="text-2xl font-japanese">スヌーズを押せ</h1>
                    <p className="text-sm text-ink-300">
                      朝起きられない人を生産するサービス
                    </p>
                  </header>

                  {/* メインコンテンツ */}
                  <main className="container mx-auto px-4 py-8">{children}</main>

                  {/* フッター */}
                  <footer className="bg-ink-900 text-paper-light py-4 px-6 border-t-4 border-ink-800 mt-12">
                    <p className="text-center text-sm">
                      © 2026 スヌーズを押せ - AWS Summit Japan 2026 ハッカソン作品
                    </p>
                  </footer>
                </div>
              </DemoProvider>
            </RecordProvider>
          </AlarmProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
