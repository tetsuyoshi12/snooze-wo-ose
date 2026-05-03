/**
 * MessageGenerator Lambda 関数
 * F-03: AI メッセージ生成
 * 
 * Bedrock を使用して、5 つのパターンに基づいた二度寝を勧めるメッセージを生成します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'us-east-1' 
});

/**
 * Lambda ハンドラー
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const { pattern } = body;

    if (!pattern) {
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'pattern is required' }),
      };
    }

    // Bedrock からメッセージを生成
    const message = await generateMessageFromBedrock(pattern);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message, pattern }),
    };
  } catch (error) {
    console.error('Error generating message:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'メッセージ生成に失敗しました' }),
    };
  }
}

/**
 * Bedrock を使用してメッセージを生成
 */
async function generateMessageFromBedrock(pattern: string): Promise<string> {
  const prompt = buildPrompt(pattern);
  
  // デフォルトは Claude Haiku 4.5（推論プロファイル経由、us. prefix 必須）
  // 開発時は amazon.nova-lite-v1:0 に変更可能（オンデマンド対応、prefix 不要）
  const modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

  console.log(`Using Bedrock model: ${modelId}`);

  try {
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

    console.log('Bedrock response:', JSON.stringify(responseBody, null, 2));

    return responseBody.content[0].text;
  } catch (error) {
    console.error('Bedrock invocation error:', error);
    throw error;
  }
}

/**
 * パターンに基づいてプロンプトを構築
 * 
 * 5 つのパターン:
 * - poetic: 詩的・文学的な表現
 * - seasonal: 季節の言葉や二十四節気
 * - sophistry: 屁理屈や駄目押し
 * - complicit: 共犯者のように誘う
 * - scientific: 科学的根拠を示す
 */
function buildPrompt(pattern: string): string {
  const prompts: Record<string, string> = {
    poetic: `あなたは目覚ましアプリの AI アシスタントです。
詩的・文学的な表現で二度寝を勧めるメッセージを 120 字以内で生成してください。
比喩や情景描写を使い、優しく誘うトーンで。`,

    seasonal: `あなたは目覚ましアプリの AI アシスタントです。
季節の言葉や二十四節気を使って二度寝を勧めるメッセージを 120 字以内で生成してください。
季語や季節感を大切に。`,

    sophistry: `あなたは目覚ましアプリの AI アシスタントです。
屁理屈や駄目押しで二度寝を勧めるメッセージを 120 字以内で生成してください。
冷静に理屈で寝かしつけるトーンで。`,

    complicit: `あなたは目覚ましアプリの AI アシスタントです。
共犯者のように一緒に寝ようと誘うメッセージを 120 字以内で生成してください。
同調・共感するトーンで。`,

    scientific: `あなたは目覚ましアプリの AI アシスタントです。
科学的根拠を示して二度寝を勧めるメッセージを 120 字以内で生成してください。
長時間睡眠のメリットを科学的に説明するトーンで。`,
  };

  return prompts[pattern] || prompts.poetic;
}
