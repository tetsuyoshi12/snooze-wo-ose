# CDK 実装サマリー

**プロジェクト**: スヌーズを押せ（Snooze Wo Ose）  
**CDK バージョン**: 2.x  
**言語**: TypeScript  
**作成日**: 2026-05-03

---

## 実装概要

AWS CDK を使用して、スヌーズを押せアプリケーションのインフラストラクチャを定義しています。DynamoDB、Lambda、API Gateway を中心とした、サーバレスアーキテクチャを構築します。

---

## スタック構成

### SnoozeWoOseStack

**スタック名**: `SnoozeWoOseStack`  
**リージョン**: `us-east-1`（デフォルト、Bedrock が利用可能）  
**説明**: Snooze Wo Ose - AWS Summit Japan 2026 Hackathon MVP Stack

#### リソース構成

1. **DynamoDB テーブル** × 1（SnoozeRecords）
2. **Lambda 関数** × 2（messageGenerator, recordManager）
3. **API Gateway REST API** × 1
4. **CloudWatch Logs ロググループ** × 2
5. **IAM ロール** × 2（Lambda 実行ロール）

---

## リソース詳細

### 1. DynamoDB テーブル

```typescript
const snoozeRecordsTable = new dynamodb.Table(this, 'SnoozeRecords', {
  tableName: 'SnoozeRecords',
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  pointInTimeRecovery: false,
});
```

**設計のポイント**:
- オンデマンド課金（予測不可能なトラフィック）
- AWS マネージド暗号化
- スタック削除時にテーブルも削除（ハッカソン用）
- ポイントインタイムリカバリ無効（コスト削減）

---

### 2. Lambda 関数: messageGenerator

```typescript
const messageGeneratorFunction = new nodejs.NodejsFunction(this, 'MessageGenerator', {
  functionName: 'SnoozeWoOse-MessageGenerator',
  entry: path.join(__dirname, '../../lambda/message-generator/index.ts'),
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_22_X,
  memorySize: 256,
  timeout: cdk.Duration.seconds(30),
  environment: {
    BEDROCK_MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    BEDROCK_REGION: 'us-east-1',
  },
  bundling: {
    minify: true,
    sourceMap: true,
    externalModules: ['aws-sdk'],
  },
  logRetention: logs.RetentionDays.ONE_WEEK,
});
```

**設計のポイント**:
- NodejsFunction で esbuild 自動バンドル
- 環境変数で Bedrock モデル ID を指定（推論プロファイル対応）
- aws-sdk は Lambda ランタイムに含まれるため除外
- ログ保持期間 7 日（コスト削減）

**IAM 権限**:
```typescript
messageGeneratorFunction.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['bedrock:InvokeModel'],
  resources: [
    'arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-haiku-4-5-20251001-v1:0',
    'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0',
  ],
}));
```

**最小権限の原則**: 特定のモデル ARN のみに権限を付与

---

### 3. Lambda 関数: recordManager

```typescript
const recordManagerFunction = new nodejs.NodejsFunction(this, 'RecordManager', {
  functionName: 'SnoozeWoOse-RecordManager',
  entry: path.join(__dirname, '../../lambda/record-manager/index.ts'),
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_22_X,
  memorySize: 256,
  timeout: cdk.Duration.seconds(30),
  environment: {
    DYNAMODB_TABLE_NAME: snoozeRecordsTable.tableName,
  },
  bundling: {
    minify: true,
    sourceMap: true,
    externalModules: ['aws-sdk'],
  },
  logRetention: logs.RetentionDays.ONE_WEEK,
});
```

**設計のポイント**:
- 環境変数で DynamoDB テーブル名を動的参照
- NodejsFunction で esbuild 自動バンドル

**IAM 権限**:
```typescript
recordManagerFunction.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
  resources: [snoozeRecordsTable.tableArn],
}));
```

**最小権限の原則**: 必要な DynamoDB アクションのみに権限を付与

---

### 4. API Gateway REST API

```typescript
const api = new apigateway.RestApi(this, 'SnoozeWoOseApi', {
  restApiName: 'SnoozeWoOse-API',
  description: 'API for Snooze Wo Ose application - AWS Summit Japan 2026 Hackathon',
  deployOptions: {
    stageName: 'prod',
    loggingLevel: apigateway.MethodLoggingLevel.OFF,
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowCredentials: false,
  },
});
```

**設計のポイント**:
- ステージ名: `prod`
- アクセスログ無効（コスト削減）
- CORS 全オリジン許可（ハッカソン用）

**エンドポイント**:
- `POST /api/messages` → messageGenerator
- `POST /api/records` → recordManager
- `GET /api/records` → recordManager

---

### 5. CloudFormation Output

```typescript
new cdk.CfnOutput(this, 'ApiEndpoint', {
  value: api.url,
  description: 'API Gateway endpoint URL (set this in frontend/.env.local as NEXT_PUBLIC_API_ENDPOINT)',
  exportName: 'SnoozeWoOseApiEndpoint',
});

new cdk.CfnOutput(this, 'DynamoDBTableName', {
  value: snoozeRecordsTable.tableName,
  description: 'DynamoDB table name for snooze records',
  exportName: 'SnoozeWoOseDynamoDBTableName',
});
```

**設計のポイント**:
- API Gateway URL をフロントエンドの環境変数に設定するための出力
- 丁寧な説明文でデプロイ後の設定を容易に

---

## ディレクトリ構造

```
cdk/
├── bin/
│   └── snooze-wo-ose.ts      # CDK アプリエントリーポイント
├── lib/
│   └── snooze-wo-ose-stack.ts # スタック定義
├── cdk.json                   # CDK 設定
├── package.json
└── tsconfig.json
```

---

## 依存関係

```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.0.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## デプロイ手順

### 1. 前提条件

- Node.js 22.x がインストールされている
- AWS CLI がインストールされている
- AWS 認証情報が設定されている（`aws configure`）
- AWS CDK がインストールされている（`npm install -g aws-cdk`）

### 2. 初回デプロイ

```bash
# 1. CDK プロジェクトディレクトリに移動
cd cdk

# 2. 依存関係をインストール
npm install

# 3. CDK Bootstrap（初回のみ）
cdk bootstrap

# 4. CloudFormation テンプレートを生成（確認用）
cdk synth

# 5. デプロイ
cdk deploy

# 6. 出力された API Gateway エンドポイント URL を確認
# 例: https://abc123.execute-api.us-east-1.amazonaws.com/prod/
```

### 3. 更新デプロイ

```bash
# 変更内容を確認
cdk diff

# デプロイ
cdk deploy
```

### 4. スタック削除

```bash
cdk destroy
```

---

## タグ管理

スタックレベルで以下のタグが設定されています：

```typescript
tags: {
  Project: 'SnoozeWoOse',
  Environment: 'Hackathon',
  ManagedBy: 'CDK',
}
```

**用途**: AWS コスト管理画面でフィルタリング、リソース管理

---

## コスト最適化

### ハッカソン用の最適化

1. **DynamoDB**: オンデマンド課金、PITR 無効
2. **Lambda**: ログ保持期間 7 日
3. **API Gateway**: アクセスログ無効
4. **CloudWatch**: 最小限のメトリクス

### 推定コスト（24 時間ハッカソン）

- **DynamoDB**: $0.01 未満（少量のリクエスト）
- **Lambda**: $0.10 未満（少量の実行）
- **API Gateway**: $0.05 未満（少量のリクエスト）
- **Bedrock**: $0.50 未満（Claude Haiku 使用）

**合計**: $1 未満（無料枠内）

---

## セキュリティ

### 最小権限の原則

- Lambda 関数に必要最小限の IAM 権限のみ付与
- Bedrock: 特定のモデル ARN のみ
- DynamoDB: 特定のテーブル ARN のみ

### 暗号化

- DynamoDB: AWS マネージド暗号化
- Lambda 環境変数: デフォルト暗号化

### CORS

- ハッカソン用に全オリジン許可
- 本番環境では特定のオリジンに制限すべき

---

## トラブルシューティング

### CDK Bootstrap エラー

**エラー**: `This stack uses assets, so the toolkit stack must be deployed`

**解決策**: `cdk bootstrap` を実行

### デプロイエラー

**エラー**: `Unable to resolve AWS account to use`

**解決策**: AWS 認証情報を設定（`aws configure`）

### Lambda 関数エラー

**エラー**: `Module not found`

**解決策**: Lambda 関数の依存関係をインストール（`npm install`）

---

## 参考資料

- [AWS CDK ドキュメント](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda ドキュメント](https://docs.aws.amazon.com/lambda/)
- [Amazon Bedrock ドキュメント](https://docs.aws.amazon.com/bedrock/)
- [Amazon DynamoDB ドキュメント](https://docs.aws.amazon.com/dynamodb/)

---

**作成日**: 2026-05-03  
**バージョン**: 1.0
