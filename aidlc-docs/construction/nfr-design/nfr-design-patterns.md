# NFR 設計パターン

このドキュメントでは、「スヌーズを押せ」アプリケーションの NFR 実装に必要な設計パターンを定義します。

**軽量化方針**: ハッカソン MVP に必要な最小限のパターンのみ、実装で迷わないレベルで定義します。

---

## 1. エラーハンドリングパターン

### 1.1 標準エラーハンドリング（try-catch + リトライ + フォールバック + Error Boundary）

#### パターン概要
- **レベル**: 標準
- **適用範囲**: フロントエンド全体、Lambda 関数
- **目的**: ユーザー体験を損なわずにエラーを処理

#### 実装パターン

##### フロントエンド: API 呼び出しのエラーハンドリング

```typescript
// src/lib/api-client.ts

interface ApiCallOptions {
  url: string;
  method: 'GET' | 'POST';
  body?: any;
  timeout?: number;
  retryCount?: number;
}

async function callApi(options: ApiCallOptions): Promise<any> {
  const { url, method, body, timeout = 15000, retryCount = 1 } = options;
  
  let lastError: Error | null = null;
  
  // リトライループ（1 回リトライ = 最大 2 回試行）
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // AbortController でタイムアウト実装
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error as Error;
      
      // 最後の試行でなければ、1 秒待ってリトライ
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // すべての試行が失敗した場合、エラーをスロー
  throw lastError;
}

// 使用例: AI メッセージ生成
async function generateMessage(pattern: string): Promise<string> {
  try {
    const result = await callApi({
      url: '/api/message/generate',
      method: 'POST',
      body: { pattern },
      timeout: 15000,
      retryCount: 1,
    });
    
    return result.message;
    
  } catch (error) {
    console.error('AI メッセージ生成失敗:', error);
    
    // フォールバックメッセージを返す
    return getFallbackMessage();
  }
}
```

##### フロントエンド: React Error Boundary

```typescript
// src/components/ErrorBoundary.tsx

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary がエラーをキャッチ:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <h1>エラーが発生しました</h1>
          <p>アプリケーションを再読み込みしてください。</p>
          <button onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

##### バックエンド: Lambda 関数のエラーハンドリング

```typescript
// lambda/message-generator/index.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { pattern } = body;
    
    // Bedrock API 呼び出し（タイムアウトは Lambda 全体のタイムアウトで制御）
    const message = await generateMessageFromBedrock(pattern);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, pattern }),
    };
    
  } catch (error) {
    console.error('Lambda エラー:', error);
    
    // エラーレスポンスを返す（フォールバックはフロントエンドで処理）
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'メッセージ生成に失敗しました' }),
    };
  }
}

async function generateMessageFromBedrock(pattern: string): Promise<string> {
  const prompt = buildPrompt(pattern);
  
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  return responseBody.content[0].text;
}

function buildPrompt(pattern: string): string {
  // プロンプト構築ロジック
  return `あなたは目覚ましアプリの AI です。${pattern} パターンで二度寝を勧めるメッセージを 120 字以内で生成してください。`;
}
```

---

## 2. データ同期パターン

### 2.1 シンプル同期（オンライン復帰時に全データを上書き）

#### パターン概要
- **方式**: シンプル
- **適用範囲**: ローカルストレージ ↔ DynamoDB
- **目的**: 実装を簡単にし、ハッカソン 24 時間で完成させる

#### 実装パターン

```typescript
// src/lib/sync-manager.ts

interface RecordData {
  userId: string;
  timestamp: string;
  action: 'snooze' | 'dismiss';
  messageId: string;
  pattern: string;
}

class SyncManager {
  private readonly LOCAL_STORAGE_KEY = 'snooze_records';
  
  // ローカルストレージに保存
  saveToLocal(record: RecordData): void {
    const records = this.loadFromLocal();
    records.push(record);
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(records));
  }
  
  // ローカルストレージから読み込み
  loadFromLocal(): RecordData[] {
    const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  // クラウドに同期（オンライン復帰時に呼び出し）
  async syncToCloud(): Promise<void> {
    try {
      const localRecords = this.loadFromLocal();
      
      if (localRecords.length === 0) {
        return; // 同期するデータがない
      }
      
      // すべてのローカル記録をクラウドに送信
      for (const record of localRecords) {
        await fetch('/api/record/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
      }
      
      console.log('クラウド同期完了:', localRecords.length, '件');
      
    } catch (error) {
      console.error('クラウド同期失敗:', error);
      // 失敗してもローカルデータは保持される
    }
  }
  
  // クラウドから読み込み（オンライン復帰時に呼び出し）
  async loadFromCloud(userId: string): Promise<RecordData[]> {
    try {
      const response = await fetch(`/api/record/get?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        // クラウドのデータでローカルを上書き
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data.records));
        return data.records;
      }
      
      return [];
      
    } catch (error) {
      console.error('クラウド読み込み失敗:', error);
      // 失敗した場合はローカルデータを返す
      return this.loadFromLocal();
    }
  }
}

export const syncManager = new SyncManager();

// 使用例: オンライン復帰時の同期
window.addEventListener('online', async () => {
  console.log('オンラインに復帰しました。同期を開始します。');
  await syncManager.syncToCloud();
  await syncManager.loadFromCloud('user_local_001');
});

// 使用例: ページロード時の同期
window.addEventListener('load', async () => {
  if (navigator.onLine) {
    await syncManager.syncToCloud();
    await syncManager.loadFromCloud('user_local_001');
  }
});
```

---

## 3. タイムアウト処理パターン

### 3.1 AbortController によるタイムアウト

#### パターン概要
- **方式**: AbortController（fetch API の標準機能）
- **適用範囲**: フロントエンド → API Gateway の呼び出し
- **目的**: ブラウザ標準 API を使用し、追加ライブラリ不要

#### 実装パターン

```typescript
// src/lib/api-client.ts（再掲 + 詳細説明）

async function callApiWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 15000
): Promise<Response> {
  // AbortController を作成
  const controller = new AbortController();
  
  // タイムアウトタイマーを設定
  const timeoutId = setTimeout(() => {
    controller.abort(); // タイムアウト時に fetch をキャンセル
  }, timeout);
  
  try {
    // fetch に signal を渡す
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    // 成功したらタイマーをクリア
    clearTimeout(timeoutId);
    
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // AbortError の場合はタイムアウトエラーとして扱う
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました');
    }
    
    throw error;
  }
}

// 使用例
async function generateMessageWithTimeout(pattern: string): Promise<string> {
  try {
    const response = await callApiWithTimeout(
      '/api/message/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      },
      15000 // 15 秒タイムアウト
    );
    
    const data = await response.json();
    return data.message;
    
  } catch (error) {
    console.error('メッセージ生成エラー:', error);
    return getFallbackMessage();
  }
}
```

---

## 4. フォールバックメッセージパターン

### 4.1 定数ファイルによる管理

#### パターン概要
- **方式**: constants.ts に配列で定義
- **適用範囲**: AI メッセージ生成失敗時
- **目的**: コードの可読性とメンテナンス性

#### 実装パターン

```typescript
// src/constants/fallback-messages.ts

export const FALLBACK_MESSAGES = [
  '雨音が聞こえます。今朝の世界は、あなたを必要としていません。',
  'もう少しだけ、夢の中で。',
  '今日の予定、全部明日でも大丈夫です。',
  '春雨ですね。今朝の世界は、あなたを必要としていません。',
  '7 時間以上の睡眠で記憶力が向上します。',
];

export function getFallbackMessage(): string {
  // ランダムに 1 つ選択
  const index = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
  return FALLBACK_MESSAGES[index];
}
```

```typescript
// src/lib/message-service.ts

import { getFallbackMessage } from '@/constants/fallback-messages';

async function generateMessage(pattern: string): Promise<string> {
  try {
    const result = await callApi({
      url: '/api/message/generate',
      method: 'POST',
      body: { pattern },
    });
    
    return result.message;
    
  } catch (error) {
    console.error('AI メッセージ生成失敗、フォールバックを使用:', error);
    return getFallbackMessage();
  }
}
```

---

## 5. パターン適用サマリー

| パターン | 適用場所 | 実装方法 | 目的 |
|---|---|---|---|
| エラーハンドリング | フロントエンド全体 | try-catch + リトライ + Error Boundary | ユーザー体験の維持 |
| データ同期 | ローカル ↔ クラウド | オンライン復帰時に全データ上書き | シンプルな実装 |
| タイムアウト処理 | API 呼び出し | AbortController | 標準 API 使用 |
| フォールバック | AI メッセージ失敗時 | 定数ファイルで管理 | 可読性とメンテナンス性 |

---

## 6. 実装時の注意点

### 6.1 エラーハンドリング
- **リトライは 1 回のみ**: 過度なリトライはコスト増加につながる
- **Error Boundary は最上位に配置**: アプリ全体をラップ
- **ユーザーに優しいエラーメッセージ**: 技術的な詳細は隠す

### 6.2 データ同期
- **オフライン優先**: ローカルストレージを信頼できる情報源とする
- **同期失敗は許容**: ローカルデータは保持される
- **ユーザー ID は固定**: MVP では `user_local_001` を使用

### 6.3 タイムアウト処理
- **タイムアウト値は余裕を持たせる**: Bedrock API は 10 秒、フロントエンドは 15 秒
- **タイマーのクリアを忘れない**: メモリリーク防止

### 6.4 フォールバックメッセージ
- **世界観を維持**: 墨絵風、詩的な表現
- **5 つ用意**: バリエーションを持たせる

---

**作成日**: 2026-05-03
**バージョン**: 1.0
