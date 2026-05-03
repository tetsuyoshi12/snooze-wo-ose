# CDK プロジェクト構造

このドキュメントでは、AWS CDK (TypeScript) を使用したインフラストラクチャのコード構造とデプロイ手順を説明します。

---

## 1. CDK プロジェクト構造

### 1.1 ディレクトリ構造

```
snooze-wo-ose/
├── frontend/                    # フロントエンドコード（Next.js）
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── lambda/                      # Lambda 関数コード
│   ├── message-generator/
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── record-manager/
│       ├── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── cdk/                         # CDK インフラコード
│   ├── bin/
│   │   └── snooze-wo-ose.ts    # CDK アプリエントリーポイント
│   ├── lib/
│   │   └── snooze-wo-ose-stack.ts  # スタック定義
│   ├── cdk.json                # CDK 設定
│   ├── package.json
│   └── tsconfig.json
│
├── aidlc-docs/                  # AI-DLC ドキュメント
└── README.md
```

---

## 2. CDK スタック定義

### 2.1 スタック構成

**スタック名**: `SnoozeWoOseStack`

**リソース構成**:
- Lambda 関数 × 2（messageGenerator, recordManager）
- API Gateway REST API × 1
- DynamoDB テーブル × 1（SnoozeRecords）
- IAM ロール × 2（Lambda 実行ロール）
- CloudWatch Logs ロググループ × 2

---

### 2.2 スタックコード構造

```typescript
// cdk/lib/snooze-wo-ose-stack.ts

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SnoozeWoOseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB テーブル
    const snoozeRecordsTable = new dynamodb.Table(this, 'SnoozeRecords', {
      tableName: 'SnoozeRecords',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // ハッカソン用
    });

    // 2. Lambda 関数: messageGenerator
    const messageGeneratorFunction = new lambda.Function(this, 'MessageGenerator', {
      functionName: 'SnoozeWoOse-MessageGenerator',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda/message-generator'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        // 開発時: Nova Lite（オンデマンド対応、prefix 不要）
        // 本番デモ時: Claude Haiku 4.5（推論プロファイル経由、us. prefix 必須）
        BEDROCK_MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
        BEDROCK_REGION: 'us-east-1',
        DYNAMODB_TABLE_NAME: snoozeRecordsTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Bedrock アクセス権限を付与
    // Claude 4.5 系は推論プロファイル経由でのみ呼び出し可能
    messageGeneratorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [
        // 推論プロファイル ARN（us. prefix 付きモデル用）
        'arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-haiku-4-5-20251001-v1:0',
        // Nova Lite（オンデマンド対応、開発時用）
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0'
      ],
    }));

    // 3. Lambda 関数: recordManager
    const recordManagerFunction = new lambda.Function(this, 'RecordManager', {
      functionName: 'SnoozeWoOse-RecordManager',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda/record-manager'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        // recordManager は Bedrock を使用しないため、この環境変数は不要
        // （将来的な拡張用に残す場合はコメントアウト）
        // BEDROCK_MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
        // BEDROCK_REGION: 'us-east-1',
        DYNAMODB_TABLE_NAME: snoozeRecordsTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // DynamoDB アクセス権限を付与
    snoozeRecordsTable.grantReadWriteData(recordManagerFunction);

    // 4. API Gateway
    const api = new apigateway.RestApi(this, 'SnoozeWoOseApi', {
      restApiName: 'SnoozeWoOse-API',
      description: 'API for Snooze Wo Ose application',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // 5. API エンドポイント: /message
    const messageResource = api.root.addResource('message');
    const messageGenerateResource = messageResource.addResource('generate');
    messageGenerateResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(messageGeneratorFunction)
    );

    // 6. API エンドポイント: /record
    const recordResource = api.root.addResource('record');
    
    const recordSaveResource = recordResource.addResource('save');
    recordSaveResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(recordManagerFunction)
    );

    const recordGetResource = recordResource.addResource('get');
    recordGetResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(recordManagerFunction)
    );

    // 7. 出力
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'SnoozeWoOseApiEndpoint',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: snoozeRecordsTable.tableName,
      description: 'DynamoDB table name',
    });
  }
}
```

---

### 2.3 CDK アプリエントリーポイント

```typescript
// cdk/bin/snooze-wo-ose.ts

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SnoozeWoOseStack } from '../lib/snooze-wo-ose-stack';

const app = new cdk.App();

new SnoozeWoOseStack(app, 'SnoozeWoOseStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Snooze Wo Ose - Hackathon MVP Stack',
});

app.synth();
```

---

### 2.4 CDK 設定ファイル

```json
// cdk/cdk.json

{
  "app": "npx ts-node --prefer-ts-exts bin/snooze-wo-ose.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}
```

---

## 3. Lambda 関数コード構造

### 3.1 messageGenerator 関数

```typescript
// lambda/message-generator/index.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'us-east-1' 
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { pattern } = body;

    if (!pattern) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'pattern is required' }),
      };
    }

    const message = await generateMessageFromBedrock(pattern);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, pattern }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'メッセージ生成に失敗しました' }),
    };
  }
}

async function generateMessageFromBedrock(pattern: string): Promise<string> {
  const prompt = buildPrompt(pattern);
  // デフォルトは Claude Haiku 4.5（推論プロファイル経由、us. prefix 必須）
  // 開発時は amazon.nova-lite-v1:0 に変更可能（オンデマンド対応、prefix 不要）
  const modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

  const command = new InvokeModelCommand({
    modelId,
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
  const prompts: Record<string, string> = {
    poetic: 'あなたは目覚ましアプリの AI です。詩的・文学的な表現で二度寝を勧めるメッセージを 120 字以内で生成してください。',
    seasonal: 'あなたは目覚ましアプリの AI です。季節の言葉や二十四節気を使って二度寝を勧めるメッセージを 120 字以内で生成してください。',
    sophistry: 'あなたは目覚ましアプリの AI です。屁理屈や駄目押しで二度寝を勧めるメッセージを 120 字以内で生成してください。',
    complicit: 'あなたは目覚ましアプリの AI です。共犯者のように一緒に寝ようと誘うメッセージを 120 字以内で生成してください。',
    scientific: 'あなたは目覚ましアプリの AI です。科学的根拠を示して二度寝を勧めるメッセージを 120 字以内で生成してください。',
  };

  return prompts[pattern] || prompts.poetic;
}
```

---

### 3.2 recordManager 関数

```typescript
// lambda/record-manager/index.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE_NAME || 'SnoozeRecords';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;

    if (method === 'POST') {
      return await handleSave(event);
    } else if (method === 'GET') {
      return await handleGet(event);
    } else {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '処理に失敗しました' }),
    };
  }
}

async function handleSave(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { userId, timestamp, action, messageId, pattern } = body;

  if (!userId || !timestamp || !action) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'userId, timestamp, action are required' }),
    };
  }

  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: { userId, timestamp, action, messageId, pattern },
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
}

async function handleGet(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'userId is required' }),
    };
  }

  const result = await docClient.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, records: result.Items || [] }),
  };
}
```

---

## 4. デプロイ手順

### 4.1 前提条件
- AWS CLI がインストールされている
- AWS 認証情報が設定されている（`aws configure`）
- Node.js 20.x がインストールされている
- AWS CDK がインストールされている（`npm install -g aws-cdk`）

### 4.2 初回デプロイ手順

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

### 4.3 Lambda 関数のビルドとデプロイ

```bash
# messageGenerator 関数
cd lambda/message-generator
npm install
npm run build  # TypeScript をコンパイル

# recordManager 関数
cd lambda/record-manager
npm install
npm run build  # TypeScript をコンパイル

# CDK デプロイ（Lambda コードも含む）
cd cdk
cdk deploy
```

### 4.4 フロントエンドのデプロイ

```bash
# 1. Amplify CLI をインストール（初回のみ）
npm install -g @aws-amplify/cli

# 2. Amplify プロジェクトを初期化
cd frontend
amplify init

# 3. Amplify Hosting を追加
amplify add hosting

# 4. 環境変数を設定
# Amplify コンソールで NEXT_PUBLIC_API_ENDPOINT を設定
# 値: CDK デプロイ時に出力された API Gateway エンドポイント URL

# 5. デプロイ
amplify publish
```

---

## 5. 更新デプロイ手順

### 5.1 Lambda 関数の更新

```bash
# 1. Lambda 関数コードを修正
# lambda/message-generator/index.ts または lambda/record-manager/index.ts

# 2. ビルド
cd lambda/message-generator
npm run build

# 3. CDK デプロイ
cd cdk
cdk deploy
```

### 5.2 インフラ設定の更新

```bash
# 1. CDK スタック定義を修正
# cdk/lib/snooze-wo-ose-stack.ts

# 2. 変更内容を確認
cdk diff

# 3. デプロイ
cdk deploy
```

### 5.3 フロントエンドの更新

```bash
# 1. フロントエンドコードを修正
# frontend/src/...

# 2. デプロイ
cd frontend
amplify publish
```

---

## 6. デプロイ後の確認

### 6.1 API Gateway エンドポイントのテスト

```bash
# messageGenerator のテスト
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/message/generate \
  -H "Content-Type: application/json" \
  -d '{"pattern":"poetic"}'

# recordManager のテスト（保存）
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/record/save \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_local_001","timestamp":"2026-05-03T00:00:00Z","action":"snooze","messageId":"msg_001","pattern":"poetic"}'

# recordManager のテスト（取得）
curl -X GET "https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/record/get?userId=user_local_001"
```

### 6.2 CloudWatch Logs の確認

```bash
# AWS CLI で Lambda ログを確認
aws logs tail /aws/lambda/SnoozeWoOse-MessageGenerator --follow
aws logs tail /aws/lambda/SnoozeWoOse-RecordManager --follow
```

### 6.3 DynamoDB テーブルの確認

```bash
# AWS CLI で DynamoDB テーブルを確認
aws dynamodb scan --table-name SnoozeRecords
```

---

## 7. トラブルシューティング

### 7.1 CDK デプロイエラー

**エラー**: `Unable to resolve AWS account to use`
**解決策**: AWS 認証情報を設定
```bash
aws configure
```

**エラー**: `This stack uses assets, so the toolkit stack must be deployed`
**解決策**: CDK Bootstrap を実行
```bash
cdk bootstrap
```

### 7.2 Lambda 関数エラー

**エラー**: `Module not found`
**解決策**: Lambda 関数の依存関係をインストール
```bash
cd lambda/message-generator
npm install
```

**エラー**: `Bedrock access denied`
**解決策**: IAM ロールに Bedrock アクセス権限を追加（CDK スタックで定義済み）

### 7.3 API Gateway エラー

**エラー**: `CORS error`
**解決策**: API Gateway の CORS 設定を確認（CDK スタックで定義済み）

---

## 8. クリーンアップ手順

### 8.1 リソースの削除

```bash
# 1. CDK スタックを削除
cd cdk
cdk destroy

# 2. Amplify アプリを削除
cd frontend
amplify delete

# 3. CloudWatch Logs を手動削除（オプション）
aws logs delete-log-group --log-group-name /aws/lambda/SnoozeWoOse-MessageGenerator
aws logs delete-log-group --log-group-name /aws/lambda/SnoozeWoOse-RecordManager
```

---

**作成日**: 2026-05-03
**バージョン**: 1.0
