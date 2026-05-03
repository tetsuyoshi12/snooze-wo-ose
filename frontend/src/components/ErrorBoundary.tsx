'use client';

/**
 * エラーバウンダリー
 * グローバルエラーハンドリング
 */

import React, { Component, ReactNode } from 'react';
import { logError } from '@/lib/error-handler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logError(error, 'ErrorBoundary');
    console.error('Error details:', errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper-light flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border-4 border-red-700">
            <h1 className="text-3xl font-japanese text-red-700 mb-4">エラーが発生しました</h1>
            <p className="text-ink-700 mb-4">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            {this.state.error && (
              <div className="bg-red-50 border-2 border-red-300 rounded p-4 mb-4">
                <p className="text-sm text-red-800 font-mono">{this.state.error.message}</p>
              </div>
            )}
            <button
              onClick={this.resetError}
              className="w-full bg-ink-800 text-paper-light py-3 rounded-lg font-japanese hover:bg-ink-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
