/**
 * SnoozeWoOseStack
 * 
 * スヌーズを押せアプリケーションのインフラストラクチャを定義します。
 * 
 * リソース構成:
 * - DynamoDB テーブル × 1（SnoozeRecords）
 * - Lambda 関数 × 2（messageGenerator, recordManager）
 * - API Gateway REST API × 1
 * - CloudWatch Logs ロググループ × 2
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class SnoozeWoOseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // 1. DynamoDB テーブル
    // ========================================
    const snoozeRecordsTable = new dynamodb.Table(this, 'SnoozeRecords', {
      tableName: 'SnoozeRecords',
      partitionKey: { 
        name: 'userId', 
        type: dynamodb.AttributeType.STRING 
      },
      sortKey: { 
        name: 'timestamp', 
        type: dynamodb.AttributeType.STRING 
      },
      // オンデマンド課金（ハッカソン用、予測不可能なトラフィック）
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // 暗号化（AWS マネージド）
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // ハッカソン用: スタック削除時にテーブルも削除
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // ポイントインタイムリカバリ: ハッカソンには不要
      pointInTimeRecovery: false,
    });

    // ========================================
    // 2. Lambda 関数: messageGenerator
    // ========================================
    const messageGeneratorFunction = new nodejs.NodejsFunction(this, 'MessageGenerator', {
      functionName: 'SnoozeWoOse-MessageGenerator',
      // Lambda 関数のエントリーポイント
      entry: path.join(__dirname, '../../lambda/message-generator/index.ts'),
      handler: 'handler',
      // Node.js 22.x ランタイム
      runtime: lambda.Runtime.NODEJS_22_X,
      // メモリとタイムアウト
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      // 環境変数
      environment: {
        // Claude Haiku 4.5（推論プロファイル経由、us. prefix 必須）
        BEDROCK_MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
        BEDROCK_REGION: 'us-east-1',
      },
      // esbuild バンドル設定
      bundling: {
        minify: true,
        sourceMap: true,
        // aws-sdk は Lambda ランタイムに含まれるため除外
        externalModules: ['aws-sdk'],
      },
      // CloudWatch Logs 保持期間: 7 日
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Bedrock アクセス権限を付与（最小権限）
    messageGeneratorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [
        // 推論プロファイル ARN（us. prefix 付きモデル用）
        `arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-haiku-4-5-20251001-v1:0`,
        // Nova Lite（開発時用、オンデマンド対応）
        `arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0`,
      ],
    }));

    // ========================================
    // 3. Lambda 関数: recordManager
    // ========================================
    const recordManagerFunction = new nodejs.NodejsFunction(this, 'RecordManager', {
      functionName: 'SnoozeWoOse-RecordManager',
      // Lambda 関数のエントリーポイント
      entry: path.join(__dirname, '../../lambda/record-manager/index.ts'),
      handler: 'handler',
      // Node.js 22.x ランタイム
      runtime: lambda.Runtime.NODEJS_22_X,
      // メモリとタイムアウト
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      // 環境変数
      environment: {
        DYNAMODB_TABLE_NAME: snoozeRecordsTable.tableName,
      },
      // esbuild バンドル設定
      bundling: {
        minify: true,
        sourceMap: true,
        // aws-sdk は Lambda ランタイムに含まれるため除外
        externalModules: ['aws-sdk'],
      },
      // CloudWatch Logs 保持期間: 7 日
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // DynamoDB アクセス権限を付与（最小権限）
    recordManagerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:Query',
      ],
      resources: [snoozeRecordsTable.tableArn],
    }));

    // ========================================
    // 4. API Gateway REST API
    // ========================================
    const api = new apigateway.RestApi(this, 'SnoozeWoOseApi', {
      restApiName: 'SnoozeWoOse-API',
      description: 'API for Snooze Wo Ose application - AWS Summit Japan 2026 Hackathon',
      deployOptions: {
        stageName: 'prod',
        // アクセスログ（ハッカソン用は無効化してコスト削減）
        loggingLevel: apigateway.MethodLoggingLevel.OFF,
      },
      // CORS 設定（ハッカソン用: 全オリジン許可）
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: false,
      },
    });

    // ========================================
    // 5. API エンドポイント: /api/messages
    // ========================================
    const apiResource = api.root.addResource('api');
    const messagesResource = apiResource.addResource('messages');
    
    messagesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(messageGeneratorFunction, {
        proxy: true,
      })
    );

    // ========================================
    // 6. API エンドポイント: /api/records
    // ========================================
    const recordsResource = apiResource.addResource('records');
    
    // POST /api/records → recordManager（保存）
    recordsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(recordManagerFunction, {
        proxy: true,
      })
    );

    // GET /api/records → recordManager（取得）
    recordsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(recordManagerFunction, {
        proxy: true,
      })
    );

    // ========================================
    // 7. CloudFormation Output
    // ========================================
    
    // API Gateway エンドポイント URL
    // フロントエンドの .env.local に設定する
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL (set this in frontend/.env.local as NEXT_PUBLIC_API_ENDPOINT)',
      exportName: 'SnoozeWoOseApiEndpoint',
    });

    // DynamoDB テーブル名
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: snoozeRecordsTable.tableName,
      description: 'DynamoDB table name for snooze records',
      exportName: 'SnoozeWoOseDynamoDBTableName',
    });

    // Lambda 関数名（デバッグ用）
    new cdk.CfnOutput(this, 'MessageGeneratorFunctionName', {
      value: messageGeneratorFunction.functionName,
      description: 'MessageGenerator Lambda function name',
    });

    new cdk.CfnOutput(this, 'RecordManagerFunctionName', {
      value: recordManagerFunction.functionName,
      description: 'RecordManager Lambda function name',
    });
  }
}
