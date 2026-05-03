# デプロイ手順ガイド

**プロジェクト**: スヌーズを押せ（Snooze Wo Ose）  
**対象**: AWS Summit Japan 2026 Hackathon  
**作成日**: 2026-05-03

---

## 目次

1. [前提条件](#前提条件)
2. [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
3. [CDK のデプロイ](#cdk-のデプロイ)
4. [Amplify Hosting のセットアップ](#amplify-hosting-のセットアップ)
5. [動作確認](#動作確認)
6. [トラブルシューティング](#トラブルシューティング)
7. [スタック削除](#スタック削除)

---

## 前提条件

### 必要なソフトウェア

- **Node.js**: 22.x LTS
- **npm**: 10.x（Node.js に付属）
- **AWS CLI**: 2.x
- **AWS CDK**: 2.x
- **Git**: 2.x

### AWS アカウント

- AWS アカウントが必要
- IAM ユーザーまたはロールに以下の権限が必要：
  - CloudFormation（スタック作成・更新・削除）
  - Lambda（関数作成・更新・削除）
  - API Gateway（API 作成・更新・削除）
  - DynamoDB（テーブル作成・更新・削除）
  - IAM（ロール作成・更新・削除）
  - CloudWatch Logs（ロググループ作成・削除）
  - Bedrock（モデル呼び出し）
  - Amplify（アプリ作成・デプロイ）

### インストール手順

#### 1. Node.js のインストール

```bash
# macOS（Homebrew）
brew install node@22

# Windows（公式インストーラー）
# https://nodejs.org/ からダウンロード

# バージョン確認
node --version  # v22.x.x
npm --version   # 10.x.x
```

#### 2. AWS CLI のインストール

```bash
# macOS（Homebrew）
brew install awscli

# Windows（公式インストーラー）
# https://aws.amazon.com/cli/ からダウンロード

# バージョン確認
aws --version  # aws-cli/2.x.x
```

#### 3. AWS 認証情報の設定

```bash
aws configure
```

以下の情報を入力：
- AWS Access Key ID
- AWS Secret Access Key
- Default region name: `us-east-1`（Bedrock が利用可能）
- Default output format: `json`

#### 4. AWS CDK のインストール

```bash
npm install -g aws-cdk

# バージョン確認
cdk --version  # 2.x.x
```

---

## ローカル開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd snooze-wo-ose
```

### 2. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

### 3. Lambda 関数のセットアップ

```bash
# messageGenerator
cd lambda/message-generator
npm install

# recordManager
cd lambda/record-manager
npm install
```

### 4. CDK のセットアップ

```bash
cd cdk
npm install
```

### 5. ローカル開発サーバーの起動（オプション）

```bash
cd frontend
npm run dev
```

ブラウザで `http://localhost:3000` を開く

**注意**: バックエンド API がまだデプロイされていないため、API 呼び出しは失敗します。

---

## CDK のデプロイ

### 1. CDK Bootstrap（初回のみ）

```bash
cd cdk
cdk bootstrap
```

**実行内容**:
- CDK Toolkit スタックを作成
- S3 バケット（CDK アセット保存用）
- IAM ロール（デプロイ用）

**注意**: 同じ AWS アカウント・リージョンで一度だけ実行すれば OK

### 2. CloudFormation テンプレートの生成（確認用）

```bash
cdk synth
```

**実行内容**:
- TypeScript コードから CloudFormation テンプレートを生成
- `cdk.out/` ディレクトリに出力

**確認ポイント**:
- Lambda 関数が正しく定義されているか
- API Gateway エンドポイントが正しく定義されているか
- DynamoDB テーブルが正しく定義されているか

### 3. 変更内容の確認（オプション）

```bash
cdk diff
```

**実行内容**:
- 現在のスタックと新しいスタックの差分を表示

### 4. デプロイ

```bash
cdk deploy
```

**実行内容**:
1. Lambda 関数のバンドル（esbuild）
2. CloudFormation スタックの作成・更新
3. リソースのプロビジョニング

**所要時間**: 約 5〜10 分

**デプロイ完了時の出力例**:
```
Outputs:
SnoozeWoOseStack.ApiEndpoint = https://abc123.execute-api.us-east-1.amazonaws.com/prod/
SnoozeWoOseStack.DynamoDBTableName = SnoozeRecords
SnoozeWoOseStack.MessageGeneratorFunctionName = SnoozeWoOse-MessageGenerator
SnoozeWoOseStack.RecordManagerFunctionName = SnoozeWoOse-RecordManager
```

### 5. API Gateway URL の保存

デプロイ完了時に出力された `ApiEndpoint` の URL をコピーして保存します。

**例**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod/`

この URL は次のステップで使用します。

---

## Amplify Hosting のセットアップ

### 方法 1: AWS コンソール経由（推奨）

#### 1. Amplify コンソールを開く

1. AWS マネジメントコンソールにログイン
2. Amplify サービスを検索して開く
3. 「新しいアプリ」→「ホストウェブアプリ」をクリック

#### 2. Git リポジトリを接続

1. GitHub / GitLab / Bitbucket を選択
2. リポジトリを選択
3. ブランチを選択（例: `main`）

#### 3. ビルド設定

Amplify が自動的に Next.js を検出します。

**ビルド設定（amplify.yml）**:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

#### 4. 環境変数の設定

「環境変数」セクションで以下を追加：

| キー | 値 |
|---|---|
| `NEXT_PUBLIC_API_ENDPOINT` | `https://abc123.execute-api.us-east-1.amazonaws.com/prod` |

**重要**: CDK デプロイ時に出力された API Gateway URL を設定してください。

#### 5. デプロイ

「保存してデプロイ」をクリック

**所要時間**: 約 5〜10 分

#### 6. デプロイ完了

デプロイが完了すると、Amplify が自動的に URL を生成します。

**例**: `https://main.d1234567890.amplifyapp.com`

---

### 方法 2: Amplify CLI 経由（上級者向け）

#### 1. Amplify CLI のインストール

```bash
npm install -g @aws-amplify/cli
```

#### 2. Amplify プロジェクトの初期化

```bash
cd frontend
amplify init
```

以下の情報を入力：
- プロジェクト名: `snooze-wo-ose`
- 環境名: `prod`
- エディタ: お好みのエディタ
- アプリタイプ: `javascript`
- フレームワーク: `react`
- ソースディレクトリ: `src`
- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `.next`

#### 3. Amplify Hosting の追加

```bash
amplify add hosting
```

以下を選択：
- ホスティングタイプ: `Hosting with Amplify Console`
- デプロイタイプ: `Manual deployment`

#### 4. 環境変数の設定

```bash
# .env.local を作成
echo "NEXT_PUBLIC_API_ENDPOINT=https://abc123.execute-api.us-east-1.amazonaws.com/prod" > .env.local
```

#### 5. デプロイ

```bash
amplify publish
```

---

## 動作確認

### 1. フロントエンドの動作確認

1. Amplify の URL をブラウザで開く
2. トップページが表示されることを確認
3. アラーム時刻を設定
4. 「アラームを設定」ボタンをクリック

### 2. API の動作確認

#### messageGenerator のテスト

```bash
curl -X POST https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/messages \
  -H "Content-Type: application/json" \
  -d '{"pattern":"poetic"}'
```

**期待される結果**:
```json
{
  "message": "朝露に濡れる花のように、もう少しだけ夢の中で揺蕩いませんか。",
  "pattern": "poetic"
}
```

#### recordManager のテスト（保存）

```bash
curl -X POST https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user_local_001",
    "timestamp":"2026-05-03T00:00:00Z",
    "action":"snooze",
    "messageId":"msg_001",
    "pattern":"poetic"
  }'
```

**期待される結果**:
```json
{
  "success": true
}
```

#### recordManager のテスト（取得）

```bash
curl -X GET "https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/records?userId=user_local_001"
```

**期待される結果**:
```json
{
  "success": true,
  "records": [
    {
      "userId": "user_local_001",
      "timestamp": "2026-05-03T00:00:00Z",
      "action": "snooze",
      "messageId": "msg_001",
      "pattern": "poetic"
    }
  ]
}
```

### 3. CloudWatch Logs の確認

```bash
# messageGenerator のログ
aws logs tail /aws/lambda/SnoozeWoOse-MessageGenerator --follow

# recordManager のログ
aws logs tail /aws/lambda/SnoozeWoOse-RecordManager --follow
```

### 4. DynamoDB テーブルの確認

```bash
aws dynamodb scan --table-name SnoozeRecords
```

---

## トラブルシューティング

### CDK デプロイエラー

#### エラー 1: `Unable to resolve AWS account to use`

**原因**: AWS 認証情報が設定されていない

**解決策**:
```bash
aws configure
```

#### エラー 2: `This stack uses assets, so the toolkit stack must be deployed`

**原因**: CDK Bootstrap が実行されていない

**解決策**:
```bash
cdk bootstrap
```

#### エラー 3: `Resource handler returned message: "User: ... is not authorized to perform: ..."`

**原因**: IAM 権限が不足

**解決策**: IAM ユーザーまたはロールに必要な権限を付与

---

### Lambda 関数エラー

#### エラー 1: `Module not found`

**原因**: Lambda 関数の依存関係がインストールされていない

**解決策**:
```bash
cd lambda/message-generator
npm install

cd lambda/record-manager
npm install
```

#### エラー 2: `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel`

**原因**: Bedrock アクセス権限が不足

**解決策**: CDK スタックで Bedrock アクセス権限が正しく設定されているか確認

#### エラー 3: `Task timed out after 30.00 seconds`

**原因**: Bedrock 呼び出しが 30 秒以内に完了しない

**解決策**: タイムアウト時間を延長（CDK スタックで設定）

---

### API Gateway エラー

#### エラー 1: `CORS error`

**原因**: CORS 設定が正しくない

**解決策**: CDK スタックで CORS 設定を確認

#### エラー 2: `{"message":"Internal server error"}`

**原因**: Lambda 関数でエラーが発生

**解決策**: CloudWatch Logs でエラーログを確認

---

### フロントエンドエラー

#### エラー 1: `Failed to fetch`

**原因**: API Gateway URL が正しく設定されていない

**解決策**: `.env.local` または Amplify 環境変数を確認

#### エラー 2: `API 失敗時にフォールバックメッセージが表示されない`

**原因**: フォールバックメッセージの実装が正しくない

**解決策**: `frontend/src/app/alarm/page.tsx` の `.catch()` を確認

---

### Amplify Hosting エラー

#### エラー 1: `Build failed`

**原因**: ビルドコマンドが正しくない

**解決策**: `amplify.yml` のビルド設定を確認

#### エラー 2: `Environment variable not set`

**原因**: 環境変数が設定されていない

**解決策**: Amplify コンソールで環境変数を設定

---

## スタック削除

### 1. Amplify アプリの削除

#### コンソール経由

1. Amplify コンソールを開く
2. アプリを選択
3. 「アクション」→「アプリを削除」

#### CLI 経由

```bash
cd frontend
amplify delete
```

### 2. CDK スタックの削除

```bash
cd cdk
cdk destroy
```

**確認プロンプト**: `Are you sure you want to delete: SnoozeWoOseStack (y/n)?`

`y` を入力してエンター

**所要時間**: 約 5 分

**削除されるリソース**:
- Lambda 関数 × 2
- API Gateway REST API × 1
- DynamoDB テーブル × 1
- CloudWatch Logs ロググループ × 2
- IAM ロール × 2

### 3. CloudWatch Logs の手動削除（オプション）

CDK スタック削除後も、一部のロググループが残る場合があります。

```bash
aws logs delete-log-group --log-group-name /aws/lambda/SnoozeWoOse-MessageGenerator
aws logs delete-log-group --log-group-name /aws/lambda/SnoozeWoOse-RecordManager
```

---

## 参考資料

### AWS ドキュメント

- [AWS CDK ドキュメント](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda ドキュメント](https://docs.aws.amazon.com/lambda/)
- [Amazon Bedrock ドキュメント](https://docs.aws.amazon.com/bedrock/)
- [Amazon DynamoDB ドキュメント](https://docs.aws.amazon.com/dynamodb/)
- [AWS Amplify ドキュメント](https://docs.aws.amazon.com/amplify/)

### Next.js ドキュメント

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Next.js デプロイ](https://nextjs.org/docs/deployment)

### プロジェクトドキュメント

- `frontend-summary.md`: フロントエンド実装サマリー
- `lambda-summary.md`: Lambda 実装サマリー
- `cdk-summary.md`: CDK 実装サマリー

---

## チェックリスト

### デプロイ前

- [ ] Node.js 22.x がインストールされている
- [ ] AWS CLI がインストールされている
- [ ] AWS 認証情報が設定されている
- [ ] AWS CDK がインストールされている
- [ ] すべての依存関係がインストールされている

### CDK デプロイ

- [ ] `cdk bootstrap` が完了している
- [ ] `cdk synth` でテンプレートが生成される
- [ ] `cdk deploy` が成功している
- [ ] API Gateway URL が出力されている

### Amplify デプロイ

- [ ] Git リポジトリが接続されている
- [ ] ビルド設定が正しい
- [ ] 環境変数が設定されている
- [ ] デプロイが成功している

### 動作確認

- [ ] フロントエンドが表示される
- [ ] API が正常に動作する
- [ ] CloudWatch Logs にログが出力される
- [ ] DynamoDB にデータが保存される

---

**作成日**: 2026-05-03  
**バージョン**: 1.0  
**最終更新**: 2026-05-03
