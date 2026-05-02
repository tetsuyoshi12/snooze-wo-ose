# 論理コンポーネント

このドキュメントでは、「スヌーズを押せ」アプリケーションの NFR 実装に必要な論理コンポーネントを定義します。

**軽量化方針**: ハッカソン MVP に必要な最小限のコンポーネント（ErrorHandler、SyncManager の 2 つのみ）を定義します。

---

## 1. コンポーネント概要

| コンポーネント名 | 責務 | 配置場所 | 依存関係 |
|---|---|---|---|
| ErrorHandler | エラーハンドリング、リトライ、フォールバック | フロントエンド | なし |
| SyncManager | ローカル ↔ クラウドのデータ同期 | フロントエンド | ErrorHandler |

---

## 2. ErrorHandler（エラーハンドラ）

### 2.1 責務
- API 呼び出しのエラーハンドリング
- タイムアウト処理（AbortController）
- リトライロジック（1 回リトライ）
- フォールバックメッセージの提供

### 2.2 インターフェース

```typescript
// src/lib/error-handler.ts

export interface ApiCallOptions {
  url: string;
  method: 'GET' | 'POST';
  body?: any;
  timeout?: number;
  retryCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ErrorHandler {
  /**
   * API 呼び出しを実行（タイムアウト + リトライ付き）
   * @param options API 呼び出しオプション
   * @returns API レスポンス
   */
  static async callApi<T>(options: ApiCallOptions): Promise<ApiResponse<T>>;
  
  /**
   * フォールバックメッセージを取得
   * @returns ランダムなフォールバックメッセージ
   */
  static getFallbackMessage(): string;
  
  /**
   * エラーをログに記録
   * @param error エラーオブジェクト
   * @param context エラーが発生したコンテキスト
   */
  static logError(error: Error, context: string): void;
}
```

### 2.3 主要メソッド

#### callApi<T>(options: ApiCallOptions): Promise<ApiResponse<T>>
- **目的**: API 呼び出しを実行し、エラーハンドリング、タイムアウト、リトライを適用
- **パラメータ**:
  - `url`: API エンドポイント URL
  - `method`: HTTP メソッド（GET または POST）
  - `body`: リクエストボディ（オプション）
  - `timeout`: タイムアウト時間（ミリ秒、デフォルト: 15000）
  - `retryCount`: リトライ回数（デフォルト: 1）
- **戻り値**: `ApiResponse<T>` オブジェクト
  - `success`: 成功フラグ
  - `data`: レスポンスデータ（成功時）
  - `error`: エラーメッセージ（失敗時）
- **エラーハンドリング**:
  - タイムアウト時: AbortController でリクエストをキャンセル
  - ネットワークエラー時: 1 回リトライ（1 秒待機）
  - すべて失敗時: `success: false` を返す

#### getFallbackMessage(): string
- **目的**: AI メッセージ生成失敗時のフォールバックメッセージを提供
- **戻り値**: ランダムに選択されたフォールバックメッセージ
- **メッセージ例**:
  - 「雨音が聞こえます。今朝の世界は、あなたを必要としていません。」
  - 「もう少しだけ、夢の中で。」
  - 「今日の予定、全部明日でも大丈夫です。」

#### logError(error: Error, context: string): void
- **目的**: エラーをコンソールに記録（開発・デバッグ用）
- **パラメータ**:
  - `error`: エラーオブジェクト
  - `context`: エラーが発生したコンテキスト（例: "AI メッセージ生成"）
- **動作**: `console.error()` でエラーを出力

### 2.4 使用例

```typescript
// AI メッセージ生成での使用例
import { ErrorHandler } from '@/lib/error-handler';

async function generateMessage(pattern: string): Promise<string> {
  const response = await ErrorHandler.callApi<{ message: string }>({
    url: '/api/message/generate',
    method: 'POST',
    body: { pattern },
    timeout: 15000,
    retryCount: 1,
  });
  
  if (response.success && response.data) {
    return response.data.message;
  } else {
    ErrorHandler.logError(
      new Error(response.error || 'Unknown error'),
      'AI メッセージ生成'
    );
    return ErrorHandler.getFallbackMessage();
  }
}
```

### 2.5 配置場所
- **ファイルパス**: `src/lib/error-handler.ts`
- **理由**: 汎用ユーティリティとして、複数のコンポーネントから利用される

---

## 3. SyncManager（同期マネージャ）

### 3.1 責務
- ローカルストレージへのデータ保存
- ローカルストレージからのデータ読み込み
- クラウド（DynamoDB）へのデータ同期
- クラウドからのデータ読み込み
- オンライン復帰時の自動同期

### 3.2 インターフェース

```typescript
// src/lib/sync-manager.ts

export interface RecordData {
  userId: string;
  timestamp: string;
  action: 'snooze' | 'dismiss';
  messageId: string;
  pattern: string;
}

export class SyncManager {
  /**
   * ローカルストレージに記録を保存
   * @param record 保存する記録データ
   */
  saveToLocal(record: RecordData): void;
  
  /**
   * ローカルストレージから記録を読み込み
   * @returns 記録データの配列
   */
  loadFromLocal(): RecordData[];
  
  /**
   * クラウドに記録を同期
   * @returns 同期成功フラグ
   */
  async syncToCloud(): Promise<boolean>;
  
  /**
   * クラウドから記録を読み込み
   * @param userId ユーザー ID
   * @returns 記録データの配列
   */
  async loadFromCloud(userId: string): Promise<RecordData[]>;
  
  /**
   * オンライン復帰時の自動同期を初期化
   */
  initAutoSync(): void;
}
```

### 3.3 主要メソッド

#### saveToLocal(record: RecordData): void
- **目的**: スヌーズ記録をローカルストレージに保存
- **パラメータ**:
  - `record`: 保存する記録データ
    - `userId`: ユーザー ID（MVP では固定値 `user_local_001`）
    - `timestamp`: タイムスタンプ（ISO 8601 形式）
    - `action`: アクション（`snooze` または `dismiss`）
    - `messageId`: メッセージ ID
    - `pattern`: メッセージパターン
- **動作**:
  1. ローカルストレージから既存記録を読み込み
  2. 新しい記録を配列に追加
  3. JSON 形式でローカルストレージに保存

#### loadFromLocal(): RecordData[]
- **目的**: ローカルストレージから記録を読み込み
- **戻り値**: 記録データの配列（記録がない場合は空配列）
- **動作**:
  1. ローカルストレージから JSON データを取得
  2. パースして配列として返す

#### syncToCloud(): Promise<boolean>
- **目的**: ローカルストレージの記録をクラウド（DynamoDB）に同期
- **戻り値**: 同期成功フラグ（`true`: 成功、`false`: 失敗）
- **動作**:
  1. ローカルストレージから記録を読み込み
  2. 記録がない場合は何もしない
  3. 各記録を `/api/record/save` に POST
  4. すべて成功したら `true` を返す
  5. 失敗してもローカルデータは保持される
- **エラーハンドリング**: ErrorHandler を使用してリトライ + ログ記録

#### loadFromCloud(userId: string): Promise<RecordData[]>
- **目的**: クラウド（DynamoDB）から記録を読み込み、ローカルストレージを上書き
- **パラメータ**:
  - `userId`: ユーザー ID（MVP では固定値 `user_local_001`）
- **戻り値**: 記録データの配列
- **動作**:
  1. `/api/record/get?userId={userId}` に GET リクエスト
  2. 成功したらクラウドのデータでローカルストレージを上書き
  3. 失敗した場合はローカルストレージのデータを返す
- **エラーハンドリング**: ErrorHandler を使用してリトライ + ログ記録

#### initAutoSync(): void
- **目的**: オンライン復帰時の自動同期を初期化
- **動作**:
  1. `window.addEventListener('online', ...)` でオンラインイベントをリッスン
  2. オンライン復帰時に `syncToCloud()` と `loadFromCloud()` を実行
  3. ページロード時にもオンラインなら同期を実行

### 3.4 使用例

```typescript
// スヌーズボタン押下時の使用例
import { syncManager } from '@/lib/sync-manager';

function handleSnooze(messageId: string, pattern: string) {
  // ローカルストレージに保存
  syncManager.saveToLocal({
    userId: 'user_local_001',
    timestamp: new Date().toISOString(),
    action: 'snooze',
    messageId,
    pattern,
  });
  
  // オンラインならクラウドに同期
  if (navigator.onLine) {
    syncManager.syncToCloud();
  }
}

// アプリ初期化時の使用例
import { syncManager } from '@/lib/sync-manager';

function initApp() {
  // 自動同期を初期化
  syncManager.initAutoSync();
  
  // オンラインならクラウドから読み込み
  if (navigator.onLine) {
    syncManager.loadFromCloud('user_local_001');
  }
}
```

### 3.5 配置場所
- **ファイルパス**: `src/lib/sync-manager.ts`
- **理由**: データ同期の責務を集約し、複数のコンポーネントから利用される

---

## 4. コンポーネント間の依存関係

```
+------------------+
|   SyncManager    |
|                  |
| - saveToLocal    |
| - loadFromLocal  |
| - syncToCloud    |
| - loadFromCloud  |
| - initAutoSync   |
+------------------+
         |
         | 依存
         v
+------------------+
|   ErrorHandler   |
|                  |
| - callApi        |
| - getFallback    |
| - logError       |
+------------------+
```

- **SyncManager → ErrorHandler**: API 呼び出し時にエラーハンドリングを利用
- **ErrorHandler**: 他のコンポーネントに依存しない（独立）

---

## 5. コンポーネント配置マップ

```
src/
├── lib/
│   ├── error-handler.ts       # ErrorHandler（エラーハンドリング）
│   ├── sync-manager.ts        # SyncManager（データ同期）
│   └── api-client.ts          # API クライアント（ErrorHandler を使用）
├── constants/
│   └── fallback-messages.ts   # フォールバックメッセージ定数
├── components/
│   └── ErrorBoundary.tsx      # React Error Boundary
└── ...
```

---

## 6. 実装時の注意点

### 6.1 ErrorHandler
- **シングルトンパターン不要**: 静的メソッドのみで実装
- **フォールバックメッセージ**: `constants/fallback-messages.ts` から読み込み
- **ログ出力**: 開発時は `console.error()`、本番時は CloudWatch Logs に自動送信

### 6.2 SyncManager
- **シングルトンパターン**: `export const syncManager = new SyncManager()` でインスタンスを 1 つだけ作成
- **ローカルストレージキー**: `snooze_records`（固定）
- **ユーザー ID**: MVP では `user_local_001`（固定）
- **同期タイミング**: オンライン復帰時、ページロード時のみ（バッテリー節約）

### 6.3 依存関係
- **SyncManager は ErrorHandler に依存**: API 呼び出し時に ErrorHandler を使用
- **ErrorHandler は独立**: 他のコンポーネントに依存しない

---

## 7. テスト戦略

### 7.1 ErrorHandler のテスト
- **単体テスト**: Jest で `callApi()` のタイムアウト、リトライ、エラーハンドリングをテスト
- **モック**: `fetch` API をモック化
- **テストケース**:
  - 正常系: API 呼び出し成功
  - タイムアウト: 15 秒でタイムアウト
  - リトライ: 1 回失敗後、2 回目で成功
  - フォールバック: すべて失敗時にフォールバックメッセージを返す

### 7.2 SyncManager のテスト
- **単体テスト**: Jest で `saveToLocal()`, `loadFromLocal()`, `syncToCloud()`, `loadFromCloud()` をテスト
- **モック**: `localStorage` と `fetch` API をモック化
- **テストケース**:
  - ローカル保存: 記録が正しく保存される
  - ローカル読み込み: 記録が正しく読み込まれる
  - クラウド同期: API 呼び出しが正しく行われる
  - クラウド読み込み: ローカルストレージが上書きされる

### 7.3 統合テスト
- **E2E テスト**: Playwright でスヌーズボタン押下 → ローカル保存 → クラウド同期の一連の流れをテスト
- **オフラインテスト**: ネットワークを切断してローカル保存のみが動作することを確認

---

## 8. 将来の拡張性

### 8.1 ErrorHandler
- **カスタムエラークラス**: エラーの種類ごとにクラスを定義（NetworkError, TimeoutError, ApiError）
- **エラー通知**: CloudWatch Alarms + SNS でエラー通知を送信

### 8.2 SyncManager
- **差分同期**: ローカルとクラウドの差分のみを同期（現在は全データ上書き）
- **競合解決**: 複数デバイスでの同期時の競合解決ロジック
- **バックグラウンド同期**: Service Worker で定期的にバックグラウンド同期

---

**作成日**: 2026-05-03
**バージョン**: 1.0
