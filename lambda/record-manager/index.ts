/**
 * RecordManager Lambda 関数
 * F-05: スヌーズ記録
 * 
 * DynamoDB を使用して、スヌーズ/解除の記録を保存・取得します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDB クライアントの初期化
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_TABLE_NAME || 'SnoozeRecords';

/**
 * Lambda ハンドラー
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const method = event.httpMethod;

    // HTTP メソッドに応じて処理を分岐
    if (method === 'POST') {
      return await handleSave(event);
    } else if (method === 'GET') {
      return await handleGet(event);
    } else {
      return {
        statusCode: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: '処理に失敗しました' }),
    };
  }
}

/**
 * 記録を保存（POST /record/save）
 */
async function handleSave(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Handling save request');

  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, timestamp, action, messageId, pattern } = body;

    // 必須パラメータのバリデーション
    if (!userId || !timestamp || !action) {
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'userId, timestamp, action are required' 
        }),
      };
    }

    // DynamoDB に保存
    const command = new PutCommand({
      TableName: tableName,
      Item: { 
        userId, 
        timestamp, 
        action, 
        messageId: messageId || `msg_${Date.now()}`, 
        pattern: pattern || 'unknown',
      },
    });

    await docClient.send(command);

    console.log(`Record saved successfully: userId=${userId}, action=${action}`);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error saving record:', error);
    throw error;
  }
}

/**
 * 記録を取得（GET /record/get?userId=xxx）
 */
async function handleGet(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Handling get request');

  try {
    const userId = event.queryStringParameters?.userId;

    // 必須パラメータのバリデーション
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }

    // DynamoDB から取得（userId をパーティションキーとして Query）
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { 
        ':userId': userId 
      },
      // 新しい順にソート（timestamp が Sort Key）
      ScanIndexForward: false,
    });

    const result = await docClient.send(command);

    console.log(`Records retrieved: userId=${userId}, count=${result.Items?.length || 0}`);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        records: result.Items || [] 
      }),
    };
  } catch (error) {
    console.error('Error retrieving records:', error);
    throw error;
  }
}
