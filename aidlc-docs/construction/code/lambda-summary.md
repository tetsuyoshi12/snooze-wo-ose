# Lambda 実装サマリー

**プロジェクト**: スヌーズを押せ（Snooze Wo Ose）  
**ランタイム**: Node.js 22.x  
**言語**: TypeScript  
**作成日**: 2026-05-03

---

## 実装概要

2 つの Lambda 関数を実装しています：
1. **messageGenerator**: Bedrock を使用して AI メッセージを生成
2. **recordManager**: DynamoDB を使用してスヌーズ記録を管理

---

## Lambda 関数一覧

### 1. messageGenerator

#### 概要
- **目的**: AI メッセージ生成（F-03）
- **トリガー**: API Gateway（POST /api/messages）
- **ランタイム**: Node.js 22.x
- **メモリ**: 256 MB
- **タイムアウト**: 30 秒

#### 環境変数
```bash
BEDROCK_MODEL_ID=us.anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_REGION=us-east-1
```

#### IAM 権限
```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": [
    "arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-haiku-4-5-20251001-v1:0",
    "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"
  ]
}
```

#### リクエスト形式
```json
{
  "pattern": "poetic" | "seasonal" | "sophistry" | "complicit" | "scientific"
}
```

#### レスポンス形式
```json
{
  "message": "朝露に濡れる花のように...",
  "pattern": "poetic"
}
```

#### エラーレスポンス
```json
{
  "error": "メッセージ生成に失敗しました"
}
```

#### 実装のポイント

1. **5 つのプロンプトパターン**
   - poetic: 詩的・文学的な表現
   - seasonal: 季節の言葉や二十四節気
   - sophistry: 屁理屈や駄目押し
   - complicit: 共犯者のように誘う
   - scientific: 科学的根拠を示す

2. **Bedrock モデル ID**
   - Claude Haiku 4.5: `us.anthropic.claude-haiku-4-5-20251001-v1:0`（推論プロファイル経由、`us.` prefix 必須）
   - Nova Lite: `amazon.nova-lite-v1:0`（開発時用、オンデマンド対応、prefix 不要）

3. **エラーハンドリング**
   - Bedrock 呼び出し失敗時は 500 エラー
   - 詳細なログ出力（リクエスト、レスポンス、エラー）

4. **CORS 対応**
   - すべてのレスポンスに `Access-Control-Allow-Origin: *` ヘッダー

---

### 2. recordManager

#### 概要
- **目的**: スヌーズ記録管理（F-05）
- **トリガー**: API Gateway（POST/GET /api/records）
- **ランタイム**: Node.js 22.x
- **メモリ**: 256 MB
- **タイムアウト**: 30 秒

#### 環境変数
```bash
DYNAMODB_TABLE_NAME=SnoozeRecords
```

#### IAM 権限
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:Query"
  ],
  "Resource": "arn:aws:dynamodb:us-east-1:*:table/SnoozeRecords"
}
```

#### リクエスト形式（POST /api/records）
```json
{
  "userId": "user_local_001",
  "timestamp": "2026-05-03T00:00:00Z",
  "action": "snooze" | "dismiss",
  "messageId": "msg_1234567890",
  "pattern": "poetic"
}
```

#### リクエスト形式（GET /api/records）
```
GET /api/records?userId=user_local_001
```

#### レスポンス形式（POST）
```json
{
  "success": true
}
```

#### レスポンス形式（GET）
```json
{
  "success": true,
  "records": [
    {
      "userId": "user_local_001",
      "timestamp": "2026-05-03T00:00:00Z",
      "action": "snooze",
      "messageId": "msg_1234567890",
      "pattern": "poetic"
    }
  ]
}
```

#### エラーレスポンス
```json
{
  "error": "userId, timestamp, action are required"
}
```

#### 実装のポイント

1. **HTTP メソッド分岐**
   - POST: handleSave（記録保存）
   - GET: handleGet（記録取得）

2. **DynamoDB 操作**
   - 保存: `PutCommand`
   - 取得: `QueryCommand`（userId をパーティションキー、新しい順にソート）

3. **バリデーション**
   - 必須パラメータチェック（userId, timestamp, action）
   - デフォルト値設定（messageId, pattern）

4. **エラーハンドリング**
   - try-catch で各処理を保護
   - 詳細なログ出力

5. **CORS 対応**
   - すべてのレスポンスに `Access-Control-Allow-Origin: *` ヘッダー

---

## ディレクトリ構造

```
lambda/
├── message-generator/
│   ├── index.ts              # Lambda ハンドラー
│   ├── package.json
│   └── tsconfig.json
└── record-manager/
    ├── index.ts              # Lambda ハンドラー
    ├── package.json
    └── tsconfig.json
```

---

## 依存関係

### messageGenerator
```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

### recordManager
```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## ビルドとデプロイ

### ローカルビルド

```bash
# messageGenerator
cd lambda/message-generator
npm install
npm run build

# recordManager
cd lambda/record-manager
npm install
npm run build
```

### CDK デプロイ

CDK が自動的に esbuild でバンドルしてデプロイします。

```bash
cd cdk
cdk deploy
```

---

## テスト

### messageGenerator のテスト

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/api/messages \
  -H "Content-Type: application/json" \
  -d '{"pattern":"poetic"}'
```

### recordManager のテスト（保存）

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user_local_001",
    "timestamp":"2026-05-03T00:00:00Z",
    "action":"snooze",
    "messageId":"msg_001",
    "pattern":"poetic"
  }'
```

### recordManager のテスト（取得）

```bash
curl -X GET "https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/api/records?userId=user_local_001"
```

---

## CloudWatch Logs

### ログの確認

```bash
# messageGenerator のログ
aws logs tail /aws/lambda/SnoozeWoOse-MessageGenerator --follow

# recordManager のログ
aws logs tail /aws/lambda/SnoozeWoOse-RecordManager --follow
```

### ログ保持期間

- **7 日間**（ハッカソン用、コスト削減）

---

## トラブルシューティング

### Bedrock アクセスエラー

**エラー**: `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel`

**原因**: IAM 権限が不足

**解決策**: CDK スタックで Bedrock アクセス権限が正しく設定されているか確認

### DynamoDB アクセスエラー

**エラー**: `AccessDeniedException: User is not authorized to perform: dynamodb:PutItem`

**原因**: IAM 権限が不足

**解決策**: CDK スタックで DynamoDB アクセス権限が正しく設定されているか確認

### タイムアウトエラー

**エラー**: `Task timed out after 30.00 seconds`

**原因**: Bedrock 呼び出しが 30 秒以内に完了しない

**解決策**: タイムアウト時間を延長（CDK スタックで設定）

---

**作成日**: 2026-05-03  
**バージョン**: 1.0
