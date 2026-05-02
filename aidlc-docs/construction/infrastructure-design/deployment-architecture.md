# デプロイメントアーキテクチャ

このドキュメントでは、「スヌーズを押せ」アプリケーションのデプロイメントアーキテクチャを視覚的に説明します。

---

## 1. システムアーキテクチャ図

```
+------------------------------------------------------------------+
|                         ユーザー（ブラウザ）                        |
|  - Chrome / Safari                                               |
|  - Web Notifications API                                         |
|  - localStorage                                                  |
+------------------------------------------------------------------+
                              |
                              | HTTPS
                              v
+------------------------------------------------------------------+
|                      AWS Amplify Hosting                         |
|  +------------------------------------------------------------+  |
|  |                  React / Next.js SPA                       |  |
|  |  - AlarmSettingPage                                        |  |
|  |  - AlarmScreen                                             |  |
|  |  - RecordDashboard                                         |  |
|  |  - DemoScenario                                            |  |
|  +------------------------------------------------------------+  |
|  環境変数: NEXT_PUBLIC_API_ENDPOINT                              |
+------------------------------------------------------------------+
                              |
                              | HTTPS (REST API)
                              v
+------------------------------------------------------------------+
|                    Amazon API Gateway (REST)                     |
|  +------------------------------------------------------------+  |
|  |  POST /message/generate                                    |  |
|  |  POST /record/save                                         |  |
|  |  GET  /record/get                                          |  |
|  +------------------------------------------------------------+  |
|  ステージ: prod                                                   |
|  CORS: すべてのオリジンを許可（開発・デモ用）                        |
+------------------------------------------------------------------+
                |                           |
                | Lambda 統合               | Lambda 統合
                v                           v
+-------------------------------+  +-------------------------------+
|  Lambda: messageGenerator     |  |  Lambda: recordManager        |
|  +-------------------------+  |  |  +-------------------------+  |
|  |  Runtime: Node.js 20.x  |  |  |  |  Runtime: Node.js 20.x  |  |
|  |  Memory: 256 MB         |  |  |  |  Memory: 256 MB         |  |
|  |  Timeout: 30 秒         |  |  |  |  Timeout: 30 秒         |  |
|  +-------------------------+  |  |  +-------------------------+  |
|  環境変数:                     |  |  環境変数:                     |
|  - BEDROCK_MODEL_ID           |  |  - BEDROCK_MODEL_ID           |
|  - BEDROCK_REGION             |  |  - BEDROCK_REGION             |
|  - DYNAMODB_TABLE_NAME        |  |  - DYNAMODB_TABLE_NAME        |
+-------------------------------+  +-------------------------------+
                |                           |
                | IAM ロール                | IAM ロール
                v                           v
+-------------------------------+  +-------------------------------+
|     Amazon Bedrock            |  |      Amazon DynamoDB          |
|  +-------------------------+  |  |  +-------------------------+  |
|  |  Model: Claude Haiku    |  |  |  |  Table: SnoozeRecords   |  |
|  |  Region: us-east-1      |  |  |  |  PK: userId             |  |
|  |  max_tokens: 200        |  |  |  |  SK: timestamp          |  |
|  +-------------------------+  |  |  |  Mode: オンデマンド      |  |
|                               |  |  +-------------------------+  |
+-------------------------------+  +-------------------------------+
                |                           |
                v                           v
+------------------------------------------------------------------+
|                       Amazon CloudWatch Logs                     |
|  +------------------------------------------------------------+  |
|  |  /aws/lambda/SnoozeWoOse-MessageGenerator (7 日保持)       |  |
|  |  /aws/lambda/SnoozeWoOse-RecordManager (7 日保持)          |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

---

## 2. データフロー図

### 2.1 AI メッセージ生成フロー

```
ユーザー（アラーム画面）
    |
    | 1. POST /message/generate
    |    { pattern: "poetic" }
    v
API Gateway
    |
    | 2. Lambda 呼び出し
    v
messageGenerator Lambda
    |
    | 3. Bedrock API 呼び出し
    |    InvokeModel
    v
Amazon Bedrock (Claude Haiku)
    |
    | 4. AI メッセージ生成
    |    "雨音が聞こえます..."
    v
messageGenerator Lambda
    |
    | 5. レスポンス返却
    |    { message: "...", pattern: "poetic" }
    v
API Gateway
    |
    | 6. JSON レスポンス
    v
ユーザー（アラーム画面に表示）
```

---

### 2.2 スヌーズ記録保存フロー

```
ユーザー（スヌーズボタン押下）
    |
    | 1. ローカルストレージに保存
    |    localStorage.setItem('snooze_records', ...)
    v
ローカルストレージ
    |
    | 2. オンラインの場合、クラウドに同期
    |    POST /record/save
    |    { userId, timestamp, action, messageId, pattern }
    v
API Gateway
    |
    | 3. Lambda 呼び出し
    v
recordManager Lambda
    |
    | 4. DynamoDB に保存
    |    PutItem
    v
DynamoDB (SnoozeRecords)
    |
    | 5. 保存成功
    v
recordManager Lambda
    |
    | 6. レスポンス返却
    |    { success: true }
    v
API Gateway
    |
    | 7. JSON レスポンス
    v
ユーザー（記録完了）
```

---

### 2.3 スヌーズ記録取得フロー

```
ユーザー（記録ダッシュボード表示）
    |
    | 1. オンラインの場合、クラウドから取得
    |    GET /record/get?userId=user_local_001
    v
API Gateway
    |
    | 2. Lambda 呼び出し
    v
recordManager Lambda
    |
    | 3. DynamoDB から取得
    |    Query (userId)
    v
DynamoDB (SnoozeRecords)
    |
    | 4. 記録リスト返却
    v
recordManager Lambda
    |
    | 5. レスポンス返却
    |    { success: true, records: [...] }
    v
API Gateway
    |
    | 6. JSON レスポンス
    v
ユーザー（ローカルストレージを上書き）
    |
    | 7. localStorage.setItem('snooze_records', ...)
    v
ローカルストレージ
    |
    | 8. 記録ダッシュボードに表示
    v
ユーザー（堕落ゲージ、連続記録を確認）
```

---

## 3. リソース間の接続

### 3.1 Lambda → Bedrock
- **プロトコル**: HTTPS
- **認証**: IAM ロール（`bedrock:InvokeModel`）
- **エンドポイント**: `bedrock-runtime.us-east-1.amazonaws.com`
- **リージョン**: us-east-1

### 3.2 Lambda → DynamoDB
- **プロトコル**: HTTPS
- **認証**: IAM ロール（`dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`）
- **エンドポイント**: `dynamodb.us-east-1.amazonaws.com`
- **リージョン**: us-east-1

### 3.3 API Gateway → Lambda
- **統合タイプ**: Lambda プロキシ統合
- **認証**: なし（パブリック API）
- **タイムアウト**: 29 秒（API Gateway の最大値）

### 3.4 Amplify → API Gateway
- **プロトコル**: HTTPS
- **認証**: なし（パブリック API）
- **CORS**: すべてのオリジンを許可

### 3.5 Lambda → CloudWatch Logs
- **プロトコル**: HTTPS
- **認証**: IAM ロール（`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`）
- **自動送信**: Lambda ランタイムが自動的にログを送信

---

## 4. セキュリティ設計

### 4.1 通信の暗号化

```
+------------------+
|  ユーザー         |
+------------------+
        | HTTPS (TLS 1.2+)
        v
+------------------+
|  Amplify Hosting |
+------------------+
        | HTTPS (TLS 1.2+)
        v
+------------------+
|  API Gateway     |
+------------------+
        | 内部通信（AWS ネットワーク）
        v
+------------------+
|  Lambda 関数     |
+------------------+
        | HTTPS (TLS 1.2+)
        v
+------------------+
|  AWS サービス    |
|  (Bedrock, DDB)  |
+------------------+
```

### 4.2 IAM ロールの最小権限

#### messageGenerator ロール
```
許可:
  - bedrock:InvokeModel (Claude Haiku モデルのみ)
  - logs:CreateLogGroup
  - logs:CreateLogStream
  - logs:PutLogEvents

拒否:
  - その他すべてのアクション
```

#### recordManager ロール
```
許可:
  - dynamodb:PutItem (SnoozeRecords テーブルのみ)
  - dynamodb:GetItem (SnoozeRecords テーブルのみ)
  - dynamodb:Query (SnoozeRecords テーブルのみ)
  - logs:CreateLogGroup
  - logs:CreateLogStream
  - logs:PutLogEvents

拒否:
  - その他すべてのアクション
```

---

## 5. 可用性設計

### 5.1 サービスレベル

| サービス | 可用性 SLA | 冗長性 |
|---|---|---|
| Amplify Hosting | 99.95% | マルチ AZ |
| API Gateway | 99.95% | マルチ AZ |
| Lambda | 99.95% | マルチ AZ |
| DynamoDB | 99.99% | マルチ AZ |
| Bedrock | 99.9% | マルチ AZ |

### 5.2 障害時の動作

#### Bedrock API 障害
```
messageGenerator Lambda
    |
    | Bedrock API 呼び出し失敗
    v
エラーレスポンス (500)
    |
    v
フロントエンド
    |
    | ErrorHandler がキャッチ
    v
フォールバックメッセージ表示
    |
    v
ユーザー（デフォルトメッセージを表示）
```

#### DynamoDB 障害
```
recordManager Lambda
    |
    | DynamoDB 書き込み失敗
    v
エラーレスポンス (500)
    |
    v
フロントエンド
    |
    | ErrorHandler がキャッチ
    v
ローカルストレージのみで動作継続
    |
    v
ユーザー（記録はローカルに保存済み）
```

---

## 6. スケーラビリティ設計

### 6.1 Lambda 自動スケーリング

```
リクエスト数増加
    |
    v
API Gateway
    |
    | 複数の Lambda インスタンスを起動
    v
+-------------+  +-------------+  +-------------+
| Lambda #1   |  | Lambda #2   |  | Lambda #3   |
+-------------+  +-------------+  +-------------+
    |                |                |
    v                v                v
並列処理（同時実行数制限なし）
```

### 6.2 DynamoDB オンデマンドスケーリング

```
書き込み/読み込み増加
    |
    v
DynamoDB
    |
    | キャパシティを自動調整
    v
スループット増加（自動）
```

---

## 7. デプロイメントプロセス

### 7.1 初回デプロイ

```
1. CDK プロジェクト作成
    |
    v
2. スタック定義
    |
    v
3. cdk synth
    |
    | CloudFormation テンプレート生成
    v
4. cdk deploy
    |
    | CloudFormation スタック作成
    v
5. リソース作成
    |
    +-- Lambda 関数
    +-- API Gateway
    +-- DynamoDB テーブル
    +-- IAM ロール
    +-- CloudWatch Logs
    |
    v
6. API Gateway エンドポイント URL 取得
    |
    v
7. Amplify 環境変数設定
    |
    | NEXT_PUBLIC_API_ENDPOINT
    v
8. フロントエンドデプロイ
    |
    v
9. デプロイ完了
```

### 7.2 更新デプロイ

```
1. コード変更
    |
    v
2. cdk diff
    |
    | 変更内容確認
    v
3. cdk deploy
    |
    | CloudFormation 変更セット適用
    v
4. リソース更新
    |
    | Lambda 関数コード更新
    | または設定変更
    v
5. デプロイ完了
```

---

## 8. モニタリングアーキテクチャ

```
+------------------------------------------------------------------+
|                         AWS サービス                              |
|  +------------------------------------------------------------+  |
|  |  Lambda, API Gateway, DynamoDB                             |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              | メトリクス自動送信
                              v
+------------------------------------------------------------------+
|                      Amazon CloudWatch                           |
|  +------------------------------------------------------------+  |
|  |  メトリクス                                                  |  |
|  |  - Lambda: Duration, Errors, Throttles                     |  |
|  |  - API Gateway: Count, Latency, 4XXError, 5XXError         |  |
|  |  - DynamoDB: ConsumedCapacity, UserErrors                  |  |
|  +------------------------------------------------------------+  |
|  |  ログ                                                        |  |
|  |  - /aws/lambda/SnoozeWoOse-MessageGenerator                |  |
|  |  - /aws/lambda/SnoozeWoOse-RecordManager                   |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              | 手動確認
                              v
+------------------------------------------------------------------+
|                      開発者（AWS コンソール）                      |
+------------------------------------------------------------------+
```

---

## 9. コスト最適化アーキテクチャ

### 9.1 コスト削減ポイント

```
+---------------------------+
|  開発時                    |
|  - Nova Lite 使用         |
|  - ローカルキャッシュ      |
+---------------------------+
            |
            v
+---------------------------+
|  本番デモ時                |
|  - Claude Haiku 使用      |
|  - max_tokens: 200        |
+---------------------------+
            |
            v
+---------------------------+
|  Lambda                   |
|  - メモリ: 256 MB         |
|  - タイムアウト: 30 秒    |
+---------------------------+
            |
            v
+---------------------------+
|  DynamoDB                 |
|  - オンデマンドモード      |
|  - バックアップなし        |
+---------------------------+
            |
            v
+---------------------------+
|  CloudWatch Logs          |
|  - 保持期間: 7 日         |
+---------------------------+
            |
            v
+---------------------------+
|  合計コスト: $0.68/月     |
|  目標 $1 以下 ✅          |
+---------------------------+
```

---

## 10. 将来の拡張アーキテクチャ

### 10.1 認証追加時

```
ユーザー
    |
    | Cognito 認証
    v
Amazon Cognito
    |
    | JWT トークン
    v
API Gateway
    |
    | Lambda オーソライザー
    v
Lambda 関数
```

### 10.2 アラーム設定管理追加時

```
API Gateway
    |
    | POST /alarm/config
    v
AlarmConfigFunction (新規)
    |
    v
DynamoDB (AlarmConfigs テーブル)
```

---

**作成日**: 2026-05-03
**バージョン**: 1.0
