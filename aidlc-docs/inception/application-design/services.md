# サービス定義とオーケストレーション

このドキュメントでは、アプリケーションのサービスレイヤー、責務、オーケストレーションパターンを定義します。

---

## サービスアーキテクチャ概要

「スヌーズを押せ」アプリケーションは、以下のサービスレイヤーで構成されます：

1. **フロントエンドサービス**: ユーザーインターフェースとクライアントサイドロジック
2. **バックエンドサービス**: AWS Lambda 関数による API エンドポイント
3. **データサービス**: ローカルストレージと DynamoDB によるデータ永続化
4. **AI サービス**: Amazon Bedrock による AI メッセージ生成

---

## 1. フロントエンドサービス

### 1.1 AlarmService
**責務**: アラーム機能の中核ロジックを管理

**提供する機能**:
- アラームのスケジューリング
- スヌーズ処理
- アラーム停止処理
- Web Notifications API の制御
- デモモードの制御

**オーケストレーション**:
```
AlarmService
  ├─> StorageService (設定の読み書き)
  ├─> NotificationService (通知の表示)
  ├─> MessageService (AI メッセージの取得)
  └─> RecordService (記録の保存)
```

**主要なワークフロー**:
1. **アラーム設定時**:
   - ユーザーが時刻を設定
   - AlarmService が setTimeout でスケジュール
   - StorageService に設定を保存

2. **アラーム鳴動時**:
   - AlarmService が triggerAlarm() を実行
   - MessageService から AI メッセージを取得
   - NotificationService で通知を表示
   - AlarmScreen コンポーネントを表示

3. **スヌーズ時**:
   - ユーザーがスヌーズボタンを押下
   - AlarmService が snooze() を実行
   - RecordService に記録を保存
   - 次のアラームをスケジュール

---

### 1.2 MessageService
**責務**: AI メッセージの取得と管理

**提供する機能**:
- MessageGeneratorFunction（Lambda）の呼び出し
- メッセージキャッシュの管理
- メッセージ履歴の保存
- エラーハンドリングとフォールバック

**オーケストレーション**:
```
MessageService
  ├─> API Gateway (Lambda 呼び出し)
  ├─> StorageService (メッセージ履歴の保存)
  └─> ErrorService (エラーハンドリング)
```

**主要なワークフロー**:
1. **メッセージ生成リクエスト**:
   - AlarmService から呼び出し
   - API Gateway 経由で MessageGeneratorFunction を呼び出し
   - 生成されたメッセージを返す
   - StorageService にメッセージ履歴を保存

2. **エラー時のフォールバック**:
   - Lambda 呼び出しが失敗した場合
   - デフォルトメッセージを返す
   - エラーログを記録

---

### 1.3 RecordService
**責務**: スヌーズ記録の管理と分析

**提供する機能**:
- 記録の保存（ローカル + クラウド）
- 記録の取得
- 堕落ゲージの計算
- 連続記録の更新
- 称号の判定

**オーケストレーション**:
```
RecordService
  ├─> StorageService (ローカル記録)
  ├─> API Gateway (RecordManagerFunction 呼び出し)
  └─> AnalyticsService (統計計算)
```

**主要なワークフロー**:
1. **記録保存時**:
   - AlarmService から呼び出し
   - StorageService にローカル保存
   - RecordManagerFunction に送信（クラウド保存）
   - 連続記録を更新

2. **記録取得時**:
   - RecordDashboard から呼び出し
   - StorageService からローカル記録を取得
   - RecordManagerFunction からクラウド記録を取得
   - マージして返す

3. **堕落ゲージ計算時**:
   - 記録データを分析
   - 連続日数、累計時間から計算
   - 0-100 の値を返す

---

### 1.4 StorageService
**責務**: データの永続化と同期

**提供する機能**:
- ローカルストレージへの読み書き
- DynamoDB との同期
- オフライン対応
- データのマージ

**オーケストレーション**:
```
StorageService
  ├─> localStorage (ブラウザストレージ)
  ├─> API Gateway (DynamoDB アクセス)
  └─> SyncService (同期ロジック)
```

**主要なワークフロー**:
1. **データ保存時**:
   - 各サービスから呼び出し
   - localStorage に即座に保存
   - バックグラウンドで DynamoDB に同期

2. **データ読み込み時**:
   - localStorage から読み込み
   - オンラインの場合、DynamoDB からも取得
   - マージして最新データを返す

3. **同期時**:
   - 定期的に実行
   - ローカルとクラウドのデータを比較
   - 差分をマージ

---

### 1.5 NotificationService
**責務**: Web Notifications API の管理

**提供する機能**:
- 通知権限のリクエスト
- 通知の表示
- 通知のクリックハンドリング

**オーケストレーション**:
```
NotificationService
  └─> Web Notifications API
```

**主要なワークフロー**:
1. **初回起動時**:
   - 通知権限をリクエスト
   - 権限状態を保存

2. **アラーム鳴動時**:
   - AlarmService から呼び出し
   - 通知を表示
   - クリック時に AlarmScreen を表示

---

### 1.6 DemoService
**責務**: デモモードの制御

**提供する機能**:
- デモシナリオの実行
- デモデータの管理
- 自動進行の制御

**オーケストレーション**:
```
DemoService
  ├─> AlarmService (デモアラームの起動)
  ├─> MessageService (デモメッセージの取得)
  └─> RecordService (デモ記録の表示)
```

**主要なワークフロー**:
1. **デモ開始時**:
   - ユーザーがデモボタンを押下
   - デモデータを読み込み
   - イントロ画面を表示

2. **デモ進行時**:
   - タイマーで自動進行
   - 各ステップを順次実行
   - 90 秒以内で完了

---

## 2. バックエンドサービス（Lambda 関数）

### 2.1 MessageGeneratorService
**責務**: AI メッセージの生成

**提供する機能**:
- Amazon Bedrock API の呼び出し
- プロンプトの構築
- パターン選択
- エラーハンドリング

**オーケストレーション**:
```
MessageGeneratorService
  ├─> Amazon Bedrock (AI モデル)
  └─> CloudWatch Logs (ログ記録)
```

**主要なワークフロー**:
1. **メッセージ生成リクエスト受信**:
   - API Gateway からイベントを受信
   - パターンを選択（またはリクエストから取得）
   - プロンプトを構築

2. **Bedrock 呼び出し**:
   - Bedrock API を呼び出し
   - 生成されたメッセージを取得
   - 120 字以内に調整

3. **レスポンス返却**:
   - メッセージ、パターン、メッセージ ID を返す
   - エラー時はフォールバックメッセージを返す

---

### 2.2 RecordManagerService
**責務**: スヌーズ記録の管理

**提供する機能**:
- DynamoDB への記録保存
- 記録の取得
- 堕落ゲージの計算
- 連続記録の更新

**オーケストレーション**:
```
RecordManagerService
  ├─> DynamoDB (SnoozeRecords テーブル)
  └─> CloudWatch Logs (ログ記録)
```

**主要なワークフロー**:
1. **記録保存リクエスト受信**:
   - API Gateway からイベントを受信
   - 記録データを検証
   - DynamoDB に保存

2. **記録取得リクエスト受信**:
   - ユーザー ID で記録を検索
   - DynamoDB から取得
   - 堕落ゲージを計算
   - 連続記録を更新

3. **レスポンス返却**:
   - 記録データ、ゲージ値、連続日数を返す

---

### 2.3 AlarmConfigService
**責務**: アラーム設定の管理（将来的な拡張用）

**提供する機能**:
- アラーム設定の保存
- アラーム設定の取得
- 複数アラームの管理

**オーケストレーション**:
```
AlarmConfigService
  ├─> DynamoDB (AlarmConfigs テーブル)
  └─> CloudWatch Logs (ログ記録)
```

**主要なワークフロー**:
1. **設定保存リクエスト受信**:
   - API Gateway からイベントを受信
   - 設定データを検証
   - DynamoDB に保存

2. **設定取得リクエスト受信**:
   - ユーザー ID で設定を検索
   - DynamoDB から取得
   - デフォルト値とマージ

---

## 3. データサービス

### 3.1 DynamoDB テーブル設計

#### SnoozeRecords テーブル
**目的**: スヌーズ記録を保存

**キー構造**:
- Partition Key: `userId` (String)
- Sort Key: `timestamp` (String, ISO 8601 形式)

**属性**:
- `action`: 'snooze' | 'dismiss'
- `messageId`: String
- `pattern`: String

**アクセスパターン**:
- ユーザー ID で全記録を取得
- ユーザー ID + 日付範囲で記録を取得

---

#### AlarmConfigs テーブル
**目的**: アラーム設定を保存

**キー構造**:
- Partition Key: `userId` (String)

**属性**:
- `alarmTime`: String (HH:MM 形式)
- `isEnabled`: Boolean
- `snoozeInterval`: Number

**アクセスパターン**:
- ユーザー ID で設定を取得
- ユーザー ID で設定を更新

---

## 4. AI サービス

### 4.1 Amazon Bedrock 統合

**使用モデル**:
- Nova Lite（軽量、低コスト）
- Claude Haiku（バランス型）
- Claude Sonnet（高品質）

**プロンプト構造**:
```
あなたは目覚ましアプリの AI アシスタントです。
ユーザーが朝起きようとしているときに、二度寝を勧める詩的なメッセージを生成してください。

パターン: {pattern}
日付: {date}
天気: {weather}

制約:
- 120 字以内
- 詩的で季節感のある表現
- 共犯的で優しいトーン
```

**パターン種別**:
1. **詩的**: 俳句や短歌風の表現
2. **季節的**: 季節や天気に関連した表現
3. **屁理屈的**: 論理的だが屁理屈な理由
4. **共犯的**: 一緒に二度寝しようという誘い
5. **科学的**: 科学的根拠（風）の理由

---

## 5. サービス間通信パターン

### 5.1 フロントエンド → バックエンド
**プロトコル**: HTTPS (REST API)
**認証**: なし（MVP では不要）
**エラーハンドリング**: フロントエンドでリトライとフォールバック

**通信フロー**:
```
Frontend Service
  └─> API Gateway
      └─> Lambda Function
          └─> DynamoDB / Bedrock
```

---

### 5.2 サービス間の依存関係

**依存関係の原則**:
- フロントエンドサービスはバックエンドサービスに依存
- バックエンドサービスは AWS サービスに依存
- サービス間は疎結合（API 経由）

**依存関係図**:
```
AlarmService
  ├─> MessageService
  ├─> RecordService
  └─> StorageService

MessageService
  └─> MessageGeneratorService (Lambda)

RecordService
  ├─> StorageService
  └─> RecordManagerService (Lambda)

StorageService
  ├─> localStorage
  └─> RecordManagerService / AlarmConfigService (Lambda)
```

---

## 6. エラーハンドリング戦略

### 6.1 フロントエンドエラーハンドリング
- **React Error Boundary**: コンポーネントエラーをキャッチ
- **Try-Catch**: 非同期処理のエラーをキャッチ
- **フォールバック**: API 失敗時のデフォルト動作

### 6.2 バックエンドエラーハンドリング
- **Lambda エラーハンドリング**: try-catch でエラーをキャッチ
- **CloudWatch Logs**: エラーログを記録
- **エラーレスポンス**: 適切な HTTP ステータスコードを返す

### 6.3 エラーの種類と対応

| エラー種別 | 対応 |
|---|---|
| ネットワークエラー | リトライ（最大 3 回） |
| Bedrock API エラー | フォールバックメッセージを使用 |
| DynamoDB エラー | ローカルストレージのみで動作 |
| 通知権限エラー | 画面表示のみで動作 |
| 予期しないエラー | Error Boundary でキャッチ、エラー画面表示 |

---

## 7. パフォーマンス最適化

### 7.1 フロントエンド最適化
- **遅延ロード**: コンポーネントの遅延ロード
- **メモ化**: React.memo、useMemo、useCallback の活用
- **キャッシュ**: メッセージ履歴のキャッシュ

### 7.2 バックエンド最適化
- **Lambda コールドスタート対策**: Provisioned Concurrency（本番環境）
- **DynamoDB 最適化**: 適切なキー設計、GSI の活用
- **Bedrock 最適化**: 軽量モデル（Nova Lite）の優先使用

---

## 8. セキュリティ考慮事項

### 8.1 データセキュリティ
- **ローカルストレージ**: 機密情報は保存しない
- **DynamoDB**: 暗号化有効化
- **API Gateway**: HTTPS のみ

### 8.2 認証・認可
- **MVP**: 認証なし（ローカルストレージベース）
- **将来**: Cognito による認証を追加予定

---

**作成日**: 2026-05-03
**バージョン**: 1.0
