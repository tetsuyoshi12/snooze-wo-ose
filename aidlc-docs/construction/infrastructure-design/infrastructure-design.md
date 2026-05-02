# インフラ設計

このドキュメントでは、「スヌーズを押せ」アプリケーションの AWS インフラ設計を定義します。

**軽量化方針**: ハッカソン MVP に必要な最小限のリソースのみを定義し、AWS CDK (TypeScript) で実装します。

---

## 1. インフラ概要

### 1.1 設計方針
- **シンプルな単一スタック構成**: 過度な分割を避ける
- **サーバレスアーキテクチャ**: Lambda + API Gateway + DynamoDB
- **最小権限の原則**: IAM ロールは必要最小限の権限のみ
- **コスト最適化**: オンデマンド課金、軽量リソース

### 1.2 リソース一覧

| リソース | 数量 | 目的 |
|---|---|---|
| Lambda 関数 | 2 | messageGenerator, recordManager |
| API Gateway | 1 | REST API エンドポイント |
| DynamoDB テーブル | 1 | SnoozeRecords |
| Amplify Hosting | 1 | フロントエンドホスティング |
| CloudWatch Logs | 2 | Lambda ログ（7 日保持） |
| IAM ロール | 2 | Lambda 実行ロール |

---

## 2. Lambda 関数設計

### 2.1 messageGenerator 関数

#### 基本設定
- **関数名**: `SnoozeWoOse-MessageGenerator`
- **ランタイム**: Node.js 20.x
- **メモリ**: 256 MB
- **タイムアウト**: 30 秒
- **アーキテクチャ**: x86_64

#### 環境変数
```typescript
{
  BEDROCK_MODEL_ID: 'anthropic.claude-haiku-20240307-v1:0',
  BEDROCK_REGION: 'us-east-1',
  DYNAMODB_TABLE_NAME: 'SnoozeRecords'
}
```

#### IAM ロール権限
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-20240307-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

#### ハンドラー
- **エントリーポイント**: `index.handler`
- **入力**: `{ pattern: string }`
- **出力**: `{ message: string, pattern: string }`

#### CloudWatch Logs
- **ロググループ**: `/aws/lambda/SnoozeWoOse-MessageGenerator`
- **保持期間**: 7 日
- **ログレベル**: INFO

---

### 2.2 recordManager 関数

#### 基本設定
- **関数名**: `SnoozeWoOse-RecordManager`
- **ランタイム**: Node.js 20.x
- **メモリ**: 256 MB
- **タイムアウト**: 30 秒
- **アーキテクチャ**: x86_64

#### 環境変数
```typescript
{
  BEDROCK_MODEL_ID: 'anthropic.claude-haiku-20240307-v1:0',
  BEDROCK_REGION: 'us-east-1',
  DYNAMODB_TABLE_NAME: 'SnoozeRecords'
}
```

#### IAM ロール権限
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/SnoozeRecords"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

#### ハンドラー
- **エントリーポイント**: `index.handler`
- **入力（保存）**: `{ userId: string, timestamp: string, action: string, messageId: string, pattern: string }`
- **入力（取得）**: `{ userId: string }`
- **出力**: `{ success: boolean, records?: RecordData[] }`

#### CloudWatch Logs
- **ロググループ**: `/aws/lambda/SnoozeWoOse-RecordManager`
- **保持期間**: 7 日
- **ログレベル**: INFO

---

## 3. API Gateway 設計

### 3.1 基本設定
- **API タイプ**: REST API
- **API 名**: `SnoozeWoOse-API`
- **ステージ名**: `prod`
- **エンドポイントタイプ**: Regional

### 3.2 CORS 設定
```typescript
{
  allowOrigins: ['*'],  // 開発・デモ用（本番化時は Amplify ドメインのみに制限）
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: false
}
```

### 3.3 エンドポイント定義

#### POST /message/generate
- **説明**: AI メッセージ生成
- **Lambda 統合**: messageGenerator
- **認証**: なし
- **リクエスト**:
  ```json
  {
    "pattern": "poetic" | "seasonal" | "sophistry" | "complicit" | "scientific"
  }
  ```
- **レスポンス**:
  ```json
  {
    "message": "string",
    "pattern": "string"
  }
  ```

#### POST /record/save
- **説明**: スヌーズ記録保存
- **Lambda 統合**: recordManager
- **認証**: なし
- **リクエスト**:
  ```json
  {
    "userId": "string",
    "timestamp": "string",
    "action": "snooze" | "dismiss",
    "messageId": "string",
    "pattern": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "success": true
  }
  ```

#### GET /record/get
- **説明**: スヌーズ記録取得
- **Lambda 統合**: recordManager
- **認証**: なし
- **クエリパラメータ**: `userId`
- **レスポンス**:
  ```json
  {
    "success": true,
    "records": [
      {
        "userId": "string",
        "timestamp": "string",
        "action": "string",
        "messageId": "string",
        "pattern": "string"
      }
    ]
  }
  ```

### 3.4 スロットリング
- **設定**: デフォルト制限を使用
- **理由**: ハッカソン MVP では不要、AWS のデフォルト保護で十分

---

## 4. DynamoDB 設計

### 4.1 SnoozeRecords テーブル

#### 基本設定
- **テーブル名**: `SnoozeRecords`
- **キャパシティモード**: オンデマンド
- **暗号化**: AWS 管理キー（デフォルト）
- **バックアップ**: なし（ハッカソン MVP のため）

#### キー設計
- **Partition Key**: `userId` (String)
- **Sort Key**: `timestamp` (String, ISO 8601 形式)

#### 属性
```typescript
{
  userId: string,        // ユーザー ID（MVP では固定値 "user_local_001"）
  timestamp: string,     // タイムスタンプ（ISO 8601）
  action: string,        // アクション（"snooze" または "dismiss"）
  messageId: string,     // メッセージ ID
  pattern: string        // メッセージパターン
}
```

#### アクセスパターン
1. **記録保存**: `PutItem` with `userId` and `timestamp`
2. **記録取得**: `Query` with `userId` (すべての記録を取得)

#### インデックス
- **GSI**: なし（シンプルなクエリパターンのため不要）

---

## 5. Amplify Hosting 設計

### 5.1 基本設定
- **アプリ名**: `SnoozeWoOse`
- **リポジトリ**: GitHub（または手動デプロイ）
- **ブランチ**: `main`
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `.next`（Next.js のデフォルト）

### 5.2 環境変数
```typescript
{
  NEXT_PUBLIC_API_ENDPOINT: 'https://<api-id>.execute-api.<region>.amazonaws.com/prod'
}
```

### 5.3 ビルド設定（amplify.yml）
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 5.4 カスタムドメイン
- **設定**: なし（デフォルトの Amplify ドメインを使用）
- **理由**: ハッカソン MVP では不要

---

## 6. CloudWatch Logs 設計

### 6.1 ロググループ

#### messageGenerator ロググループ
- **名前**: `/aws/lambda/SnoozeWoOse-MessageGenerator`
- **保持期間**: 7 日
- **暗号化**: なし（デフォルト）

#### recordManager ロググループ
- **名前**: `/aws/lambda/SnoozeWoOse-RecordManager`
- **保持期間**: 7 日
- **暗号化**: なし（デフォルト）

### 6.2 ログストリーム
- **構成**: Lambda 関数ごとに自動作成（デフォルト）
- **命名規則**: `YYYY/MM/DD/[$LATEST]<request-id>`

### 6.3 ログ内容
- Lambda 関数の開始・終了
- Bedrock API 呼び出しの成功・失敗
- DynamoDB 操作の成功・失敗
- エラーメッセージとスタックトレース

---

## 7. IAM ロール設計

### 7.1 messageGenerator 実行ロール

#### ロール名
`SnoozeWoOse-MessageGenerator-Role`

#### 信頼ポリシー
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### アクセス許可ポリシー
1. **Bedrock アクセス**:
   - `bedrock:InvokeModel`（最小権限）
   - リソース: Claude Haiku モデルのみ

2. **CloudWatch Logs アクセス**:
   - `logs:CreateLogGroup`
   - `logs:CreateLogStream`
   - `logs:PutLogEvents`

---

### 7.2 recordManager 実行ロール

#### ロール名
`SnoozeWoOse-RecordManager-Role`

#### 信頼ポリシー
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### アクセス許可ポリシー
1. **DynamoDB アクセス**:
   - `dynamodb:PutItem`（記録保存）
   - `dynamodb:GetItem`（単一記録取得）
   - `dynamodb:Query`（ユーザーの全記録取得）
   - リソース: SnoozeRecords テーブルのみ

2. **CloudWatch Logs アクセス**:
   - `logs:CreateLogGroup`
   - `logs:CreateLogStream`
   - `logs:PutLogEvents`

---

## 8. ネットワーク設計

### 8.1 VPC
- **使用**: なし
- **理由**: サーバレスアーキテクチャのため VPC 不要

### 8.2 セキュリティグループ
- **使用**: なし
- **理由**: Lambda 関数は VPC 外で実行

### 8.3 通信経路
```
ユーザー（ブラウザ）
  ↓ HTTPS
Amplify Hosting（フロントエンド）
  ↓ HTTPS
API Gateway
  ↓ 内部通信
Lambda 関数
  ↓ HTTPS
AWS サービス（Bedrock, DynamoDB）
```

---

## 9. セキュリティ設計

### 9.1 データ保護
- **通信**: すべて HTTPS
- **DynamoDB 暗号化**: AWS 管理キー（デフォルト）
- **ローカルストレージ**: 暗号化なし（機密情報なし）

### 9.2 認証・認可
- **API Gateway**: 認証なし（MVP 方針）
- **Lambda 実行ロール**: 最小権限の原則
- **Bedrock アクセス**: IAM ロール経由のみ

### 9.3 API キー管理
- **方針**: API キーは使用しない
- **理由**: 認証なしの公開 API（ハッカソン MVP）

---

## 10. コスト見積もり

### 10.1 月間コスト見積もり（ハッカソン期間 30 日）

| サービス | 使用量 | 単価 | 月間コスト |
|---|---|---|---|
| Lambda（messageGenerator） | 1,000 リクエスト | $0.20/100 万リクエスト | $0.0002 |
| Lambda（recordManager） | 2,000 リクエスト | $0.20/100 万リクエスト | $0.0004 |
| API Gateway | 3,000 リクエスト | $3.50/100 万リクエスト | $0.01 |
| DynamoDB | 3,000 書き込み、3,000 読み込み | オンデマンド | $0.01 |
| Bedrock（Claude Haiku） | 1,000 リクエスト × 200 トークン | $0.25/100 万入力トークン | $0.05 |
| Amplify Hosting | 1 GB ストレージ、10 GB 転送 | $0.01/GB | $0.11 |
| CloudWatch Logs | 1 GB ログ | $0.50/GB | $0.50 |
| **合計** | | | **$0.68** |

**目標**: $1 以下 ✅

### 10.2 コスト最適化策
- Nova Lite を開発時に使用（Claude Haiku より安価）
- CloudWatch Logs 保持期間を 7 日に制限
- DynamoDB オンデマンドモード（使用量に応じた課金）
- Lambda メモリを 256 MB に制限

---

## 11. モニタリング設計

### 11.1 CloudWatch メトリクス

#### Lambda メトリクス（自動収集）
- 実行時間（Duration）
- エラー率（Errors）
- 同時実行数（ConcurrentExecutions）
- スロットル数（Throttles）

#### API Gateway メトリクス（自動収集）
- リクエスト数（Count）
- レイテンシ（Latency）
- 4xx エラー（4XXError）
- 5xx エラー（5XXError）

#### DynamoDB メトリクス（自動収集）
- 読み込みキャパシティユニット（ConsumedReadCapacityUnits）
- 書き込みキャパシティユニット（ConsumedWriteCapacityUnits）
- スロットルリクエスト（UserErrors）

### 11.2 アラーム
- **設定**: なし
- **理由**: ハッカソン MVP では不要、CloudWatch Logs で手動確認

---

## 12. デプロイ設計

### 12.1 デプロイ方法
- **ツール**: AWS CDK (TypeScript)
- **スタック名**: `SnoozeWoOseStack`
- **環境**: 単一環境（prod のみ）

### 12.2 デプロイ手順
1. CDK プロジェクトの初期化
2. スタック定義の作成
3. `cdk synth` でテンプレート生成
4. `cdk deploy` でデプロイ
5. API Gateway エンドポイント URL を Amplify 環境変数に設定
6. フロントエンドを Amplify にデプロイ

### 12.3 ロールバック戦略
- **方法**: CloudFormation スタックのロールバック
- **手順**: `cdk deploy --rollback` または AWS コンソールから手動ロールバック

---

## 13. 運用設計

### 13.1 ログ確認
- **方法**: CloudWatch Logs コンソール
- **頻度**: エラー発生時のみ

### 13.2 コストモニタリング
- **方法**: AWS Cost Explorer
- **頻度**: 週次確認

### 13.3 パフォーマンスモニタリング
- **方法**: CloudWatch メトリクス
- **頻度**: デモ前に確認

---

## 14. 将来の拡張性

### 14.1 スケーラビリティ
- **Lambda**: 自動スケール（同時実行数制限なし）
- **API Gateway**: 自動スケール
- **DynamoDB**: オンデマンドモードで自動スケール

### 14.2 将来的な追加リソース
- **AlarmConfigFunction**: アラーム設定管理（将来拡張用）
- **AlarmConfigs テーブル**: アラーム設定保存（将来拡張用）
- **Cognito**: ユーザー認証（本番化時）
- **CloudWatch Alarms**: エラー通知（本番化時）

---

**作成日**: 2026-05-03
**バージョン**: 1.0
