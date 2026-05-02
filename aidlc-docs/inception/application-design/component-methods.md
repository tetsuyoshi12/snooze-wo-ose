# コンポーネントメソッド定義

このドキュメントでは、各コンポーネントのメソッドシグネチャ、入出力タイプ、高レベル目的を定義します。

**注意**: 詳細なビジネスルールは後の機能設計（CONSTRUCTION フェーズ）で定義します。

---

## フロントエンドコンポーネント

### 1. AlarmSettingPage

#### setAlarmTime(time: string): void
- **目的**: アラーム時刻を設定する
- **入力**: time（HH:MM 形式の文字列）
- **出力**: なし
- **副作用**: AlarmContext の状態を更新、ローカルストレージに保存

#### toggleAlarm(enabled: boolean): void
- **目的**: アラームの有効/無効を切り替える
- **入力**: enabled（真偽値）
- **出力**: なし
- **副作用**: AlarmContext の状態を更新

#### setSnoozeInterval(minutes: number): void
- **目的**: スヌーズ間隔を設定する
- **入力**: minutes（分単位の数値）
- **出力**: なし
- **副作用**: AlarmContext の状態を更新

#### startDemoMode(): void
- **目的**: デモモードを起動する
- **入力**: なし
- **出力**: なし
- **副作用**: DemoContext を有効化、DemoScenario コンポーネントに遷移

---

### 2. AlarmScreen

#### handleSnooze(): Promise<void>
- **目的**: スヌーズボタンが押されたときの処理
- **入力**: なし
- **出力**: Promise（非同期処理）
- **副作用**: 
  - AlarmManager.snooze() を呼び出し
  - RecordManagerFunction に記録を送信
  - 画面を閉じる

#### handleDismiss(): Promise<void>
- **目的**: 起きるボタンが押されたときの処理
- **入力**: なし
- **出力**: Promise（非同期処理）
- **副作用**: 
  - AlarmManager.dismiss() を呼び出し
  - RecordManagerFunction に記録を送信
  - 画面を閉じる

#### playBGM(): void
- **目的**: 雨音 BGM を再生する（Nice-to-have）
- **入力**: なし
- **出力**: なし
- **副作用**: Audio API で BGM を再生

#### stopBGM(): void
- **目的**: 雨音 BGM を停止する
- **入力**: なし
- **出力**: なし
- **副作用**: Audio API で BGM を停止

---

### 3. RecordDashboard

#### loadRecords(): Promise<RecordData[]>
- **目的**: スヌーズ記録を読み込む
- **入力**: なし
- **出力**: Promise<RecordData[]>（記録データの配列）
- **副作用**: RecordManagerFunction から記録を取得

#### calculateGauge(): number
- **目的**: 堕落ゲージの値を計算する
- **入力**: なし（内部状態から計算）
- **出力**: number（0-100 の数値）
- **副作用**: なし

#### getConsecutiveDays(): number
- **目的**: 連続二度寝日数を取得する
- **入力**: なし
- **出力**: number（連続日数）
- **副作用**: なし

#### getTotalSnoozeTime(): number
- **目的**: 累計スヌーズ時間を取得する
- **入力**: なし
- **出力**: number（分単位）
- **副作用**: なし

#### getCurrentTitle(): string
- **目的**: 現在の称号を取得する（Nice-to-have）
- **入力**: なし
- **出力**: string（称号名）
- **副作用**: なし

---

### 4. DemoScenario

#### startDemo(): void
- **目的**: デモシナリオを開始する
- **入力**: なし
- **出力**: なし
- **副作用**: デモステップを順次実行

#### nextStep(): void
- **目的**: 次のデモステップに進む
- **入力**: なし
- **出力**: なし
- **副作用**: currentStep を更新

#### loadDemoData(): DemoData
- **目的**: 事前に仕込まれたデモデータを読み込む
- **入力**: なし
- **出力**: DemoData（デモ用のデータオブジェクト）
- **副作用**: なし

#### autoProgress(): void
- **目的**: デモを自動進行させる
- **入力**: なし
- **出力**: なし
- **副作用**: タイマーで自動的に nextStep() を呼び出し

---

### 5. CertificateModal

#### open(): void
- **目的**: モーダルを開く
- **入力**: なし
- **出力**: なし
- **副作用**: isOpen を true に設定

#### close(): void
- **目的**: モーダルを閉じる
- **入力**: なし
- **出力**: なし
- **副作用**: isOpen を false に設定

#### formatDate(date: Date): string
- **目的**: 達成日時をフォーマットする
- **入力**: date（Date オブジェクト）
- **出力**: string（フォーマットされた日時文字列）
- **副作用**: なし

---

### 6. MessageHistoryModal

#### open(): void
- **目的**: モーダルを開く
- **入力**: なし
- **出力**: なし
- **副作用**: isOpen を true に設定

#### close(): void
- **目的**: モーダルを閉じる
- **入力**: なし
- **出力**: なし
- **副作用**: isOpen を false に設定

#### loadMessages(): Promise<Message[]>
- **目的**: メッセージ履歴を読み込む
- **入力**: なし
- **出力**: Promise<Message[]>（メッセージの配列）
- **副作用**: ローカルストレージまたは DynamoDB から取得

#### filterByPattern(pattern: string): Message[]
- **目的**: パターン種別でメッセージをフィルタリングする
- **入力**: pattern（パターン名）
- **出力**: Message[]（フィルタリングされたメッセージ配列）
- **副作用**: なし

#### searchMessages(query: string): Message[]
- **目的**: メッセージを検索する
- **入力**: query（検索クエリ）
- **出力**: Message[]（検索結果の配列）
- **副作用**: なし

---

### 7. AlarmManager

#### setAlarm(time: string): void
- **目的**: アラームをスケジュールする
- **入力**: time（HH:MM 形式）
- **出力**: なし
- **副作用**: setTimeout でアラームを設定

#### snooze(minutes: number): void
- **目的**: スヌーズ処理を実行する
- **入力**: minutes（スヌーズ間隔）
- **出力**: なし
- **副作用**: 
  - 次のアラームをスケジュール
  - 記録を保存

#### dismiss(): void
- **目的**: アラームを停止する
- **入力**: なし
- **出力**: なし
- **副作用**: 
  - アラームをクリア
  - 記録を保存

#### triggerAlarm(): Promise<void>
- **目的**: アラームを鳴動させる
- **入力**: なし
- **出力**: Promise（非同期処理）
- **副作用**: 
  - Web Notifications API で通知
  - AlarmScreen を表示
  - MessageGeneratorFunction を呼び出し

#### triggerDemo(): void
- **目的**: デモモードでアラームを即座に鳴動させる
- **入力**: なし
- **出力**: なし
- **副作用**: triggerAlarm() を即座に実行

#### requestNotificationPermission(): Promise<boolean>
- **目的**: 通知権限をリクエストする
- **入力**: なし
- **出力**: Promise<boolean>（権限が許可されたか）
- **副作用**: ブラウザの通知権限ダイアログを表示

---

### 8. StorageManager

#### save(key: string, data: any): void
- **目的**: データをローカルストレージに保存する
- **入力**: key（キー）, data（保存するデータ）
- **出力**: なし
- **副作用**: localStorage に書き込み

#### load(key: string): any
- **目的**: データをローカルストレージから読み込む
- **入力**: key（キー）
- **出力**: any（読み込んだデータ）
- **副作用**: なし

#### sync(): Promise<void>
- **目的**: ローカルストレージと DynamoDB を同期する
- **入力**: なし
- **出力**: Promise（非同期処理）
- **副作用**: 
  - ローカルデータを DynamoDB に送信
  - DynamoDB からデータを取得してマージ

#### clear(key: string): void
- **目的**: 特定のキーのデータを削除する
- **入力**: key（キー）
- **出力**: なし
- **副作用**: localStorage から削除

---

### 9. ErrorBoundary

#### componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void
- **目的**: React エラーをキャッチする
- **入力**: error（エラーオブジェクト）, errorInfo（エラー情報）
- **出力**: なし
- **副作用**: 
  - エラーログを記録
  - hasError を true に設定

#### resetError(): void
- **目的**: エラー状態をリセットする
- **入力**: なし
- **出力**: なし
- **副作用**: hasError を false に設定

---

### 10. AppLayout

#### setActiveTab(tab: string): void
- **目的**: アクティブなタブを設定する
- **入力**: tab（タブ名）
- **出力**: なし
- **副作用**: activeTab を更新

#### openModal(modalName: string): void
- **目的**: モーダルを開く
- **入力**: modalName（モーダル名）
- **出力**: なし
- **副作用**: 対応するモーダルの isOpen を true に設定

#### closeModal(modalName: string): void
- **目的**: モーダルを閉じる
- **入力**: modalName（モーダル名）
- **出力**: なし
- **副作用**: 対応するモーダルの isOpen を false に設定

---

## バックエンドコンポーネント（Lambda 関数）

### 11. MessageGeneratorFunction

#### handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
- **目的**: Lambda 関数のエントリーポイント
- **入力**: event（API Gateway イベント）
- **出力**: Promise<APIGatewayProxyResult>（API レスポンス）
- **副作用**: Bedrock API を呼び出し

#### generateMessage(pattern: string, context?: MessageContext): Promise<string>
- **目的**: AI メッセージを生成する
- **入力**: pattern（パターン名）, context（オプションのコンテキスト）
- **出力**: Promise<string>（生成されたメッセージ）
- **副作用**: Bedrock API を呼び出し

#### selectPattern(): string
- **目的**: 5 つのパターンからランダムに選択する
- **入力**: なし
- **出力**: string（選択されたパターン名）
- **副作用**: なし

#### buildPrompt(pattern: string, context?: MessageContext): string
- **目的**: Bedrock 用のプロンプトを構築する
- **入力**: pattern（パターン名）, context（コンテキスト）
- **出力**: string（プロンプト文字列）
- **副作用**: なし

#### callBedrock(prompt: string): Promise<string>
- **目的**: Bedrock API を呼び出す
- **入力**: prompt（プロンプト）
- **出力**: Promise<string>（生成されたテキスト）
- **副作用**: AWS Bedrock API を呼び出し

#### handleError(error: Error): APIGatewayProxyResult
- **目的**: エラーハンドリングとフォールバック
- **入力**: error（エラーオブジェクト）
- **出力**: APIGatewayProxyResult（エラーレスポンス）
- **副作用**: エラーログを記録

---

### 12. RecordManagerFunction

#### handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
- **目的**: Lambda 関数のエントリーポイント
- **入力**: event（API Gateway イベント）
- **出力**: Promise<APIGatewayProxyResult>（API レスポンス）
- **副作用**: DynamoDB にアクセス

#### saveRecord(record: RecordData): Promise<boolean>
- **目的**: スヌーズ記録を保存する
- **入力**: record（記録データ）
- **出力**: Promise<boolean>（成功/失敗）
- **副作用**: DynamoDB に書き込み

#### getRecords(userId: string): Promise<RecordData[]>
- **目的**: ユーザーの記録を取得する
- **入力**: userId（ユーザー ID）
- **出力**: Promise<RecordData[]>（記録の配列）
- **副作用**: DynamoDB から読み込み

#### calculateGauge(records: RecordData[]): number
- **目的**: 堕落ゲージを計算する
- **入力**: records（記録の配列）
- **出力**: number（ゲージ値 0-100）
- **副作用**: なし

#### updateConsecutiveDays(userId: string): Promise<number>
- **目的**: 連続記録を更新する
- **入力**: userId（ユーザー ID）
- **出力**: Promise<number>（連続日数）
- **副作用**: DynamoDB を更新

#### checkCertificate(consecutiveDays: number): boolean
- **目的**: 卒業証書の発行条件をチェックする
- **入力**: consecutiveDays（連続日数）
- **出力**: boolean（30 日達成したか）
- **副作用**: なし

#### assignTitle(gauge: number): string
- **目的**: 称号を判定する（Nice-to-have）
- **入力**: gauge（堕落ゲージ値）
- **出力**: string（称号名）
- **副作用**: なし

---

### 13. AlarmConfigFunction

#### handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
- **目的**: Lambda 関数のエントリーポイント
- **入力**: event（API Gateway イベント）
- **出力**: Promise<APIGatewayProxyResult>（API レスポンス）
- **副作用**: DynamoDB にアクセス

#### saveConfig(config: AlarmConfig): Promise<boolean>
- **目的**: アラーム設定を保存する
- **入力**: config（設定データ）
- **出力**: Promise<boolean>（成功/失敗）
- **副作用**: DynamoDB に書き込み

#### getConfig(userId: string): Promise<AlarmConfig>
- **目的**: アラーム設定を取得する
- **入力**: userId（ユーザー ID）
- **出力**: Promise<AlarmConfig>（設定データ）
- **副作用**: DynamoDB から読み込み

---

## 共通コンポーネント

### 14. Button

#### handleClick(event: React.MouseEvent): void
- **目的**: クリックイベントを処理する
- **入力**: event（マウスイベント）
- **出力**: なし
- **副作用**: onClick プロップを呼び出し

---

### 15. ProgressBar

#### calculatePercentage(value: number, max: number): number
- **目的**: パーセンテージを計算する
- **入力**: value（現在値）, max（最大値）
- **出力**: number（パーセンテージ）
- **副作用**: なし

---

### 16. Modal

#### handleOverlayClick(event: React.MouseEvent): void
- **目的**: オーバーレイクリックでモーダルを閉じる
- **入力**: event（マウスイベント）
- **出力**: なし
- **副作用**: onClose プロップを呼び出し

#### handleEscapeKey(event: KeyboardEvent): void
- **目的**: ESC キーでモーダルを閉じる
- **入力**: event（キーボードイベント）
- **出力**: なし
- **副作用**: onClose プロップを呼び出し

---

## 型定義

### RecordData
```typescript
interface RecordData {
  userId: string;
  timestamp: string;
  action: 'snooze' | 'dismiss';
  messageId: string;
  pattern: string;
}
```

### AlarmConfig
```typescript
interface AlarmConfig {
  userId: string;
  alarmTime: string;
  isEnabled: boolean;
  snoozeInterval: number;
}
```

### MessageContext
```typescript
interface MessageContext {
  date?: string;
  weather?: string;
}
```

### DemoData
```typescript
interface DemoData {
  messages: string[];
  records: RecordData[];
  gauge: number;
  consecutiveDays: number;
}
```

### Message
```typescript
interface Message {
  messageId: string;
  pattern: string;
  text: string;
  timestamp: string;
}
```

---

**作成日**: 2026-05-03
**バージョン**: 1.0
