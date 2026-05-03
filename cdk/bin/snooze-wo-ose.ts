#!/usr/bin/env node
/**
 * CDK アプリケーションエントリーポイント
 * 
 * このファイルは CDK アプリケーションを初期化し、
 * SnoozeWoOseStack をインスタンス化します。
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SnoozeWoOseStack } from '../lib/snooze-wo-ose-stack';

const app = new cdk.App();

// スタックを作成
// 環境変数から AWS アカウントとリージョンを取得
// デフォルトは us-east-1（Bedrock が利用可能なリージョン）
new SnoozeWoOseStack(app, 'SnoozeWoOseStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Snooze Wo Ose - AWS Summit Japan 2026 Hackathon MVP Stack',
  tags: {
    Project: 'SnoozeWoOse',
    Environment: 'Hackathon',
    ManagedBy: 'CDK',
  },
});

app.synth();
