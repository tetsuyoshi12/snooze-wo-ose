# 技術スタック決定書

このドキュメントでは、「スヌーズを押せ」アプリケーションの技術スタック選択とその理由を記載します。

---

## 1. フロントエンド技術スタック

### 1.1 フレームワーク

#### Next.js
- **バージョン**: 14.x（最新安定版）
- **選択理由**:
  - SSR/SSG によるパフォーマンス最適化
  - ルーティングが組み込み済み（ページ遷移が容易）
  - API Routes でバックエンドロジックも記述可能（将来拡張用）
  - Vercel または Amplify Hosting で簡単デプロイ
  - TypeScript サポートが標準
- **代替案**:
  - Create React App: 設定不要だが、SSR なし
  - Vite + React: 高速ビルドだが、ルーティング別途必要

### 1.2 UI ライブラリ

#### Tailwind CSS
- **バージョン**: 3.x
- **選択理由**:
  - ユーティリティファーストで高速開発
  - カスタムデザイン（墨絵風）が容易
  - バンドルサイズが小さい（未使用クラスを削除）
  - レスポンシブデザインが簡単
- **代替案**:
  - Material-UI: コンポーネントが豊富だが、カスタマイズが複雑
  - Chakra UI: アクセシビリティ重視だが、学習コスト高

### 1.3 状態管理

#### React Context API
- **選択理由**:
  - シンプル、追加ライブラリ不要
  - アプリケーション規模が小さい（16 コンポーネント）
  - グローバル状態が少ない（アラーム設定、記録データ）
- **代替案**:
  - Redux: 大規模アプリ向け、オーバースペック
  - Zustand: 軽量だが、Context API で十分

### 1.4 データ永続化

#### localStorage API
- **選択理由**:
  - ブラウザ標準 API、追加ライブラリ不要
  - オフライン対応が容易
  - シンプルな JSON 保存
- **補助**: DynamoDB との同期（オンライン復帰時）

### 1.5 HTTP クライアント

#### fetch API
- **選択理由**:
  - ブラウザ標準 API、追加ライブラリ不要
  - Promise ベース、async/await で使いやすい
- **代替案**:
  - axios: 機能豊富だが、バンドルサイズ増加

### 1.6 型システム

#### TypeScript
- **バージョン**: 5.x
- **選択理由**:
  - 型安全性、バグ削減
  - IDE サポート（自動補完、リファクタリング）
  - Next.js との統合が標準
  - フロントエンドとバックエンドで型を共有可能
- **設定**: strict モード有効化

---

## 2. バックエンド技術スタック

### 2.1 コンピューティング

#### AWS Lambda
- **ランタイム**: Node.js 22.x
- **メモリ**: 256 MB
- **タイムアウト**: 30 秒
- **選択理由**:
  - サーバレス、自動スケール
  - 従量課金、コスト効率
  - Bedrock SDK が利用可能
  - TypeScript で記述可能

#### Lambda 関数構成
1. **MessageGeneratorFunction**
   - 目的: AI メッセージ生成
   - トリガー: API Gateway
   - 依存: Bedrock SDK
2. **RecordManagerFunction**
   - 目的: スヌーズ記録管理
   - トリガー: API Gateway
   - 依存: DynamoDB SDK

**注意**: AlarmConfigFunction は将来用のため、MVP ではスキップ

### 2.2 API ゲートウェイ

#### Amazon API Gateway (REST API)
- **選択理由**:
  - Lambda との統合が容易
  - CORS 設定が簡単
  - HTTPS 自動提供
  - 従量課金
- **エンドポイント**:
  - `POST /api/message/generate` → MessageGeneratorFunction
  - `POST /api/record/save` → RecordManagerFunction
  - `GET /api/record/get` → RecordManagerFunction

### 2.3 データベース

#### Amazon DynamoDB
- **テーブル**: SnoozeRecords
- **キャパシティモード**: オンデマンド
- **選択理由**:
  - サーバレス、自動スケール
  - 低レイテンシ
  - 従量課金
  - Lambda との統合が容易
- **キー設計**:
  - Partition Key: `userId` (String)
  - Sort Key: `timestamp` (String, ISO 8601)

### 2.4 AI サービス

#### Amazon Bedrock
- **開発時モデル**: Amazon Nova Lite
  - 理由: 低コスト、開発・テスト用
- **本番デモ時モデル**: Claude Haiku
  - 理由: バランス型、品質とコストの両立
- **設定**:
  - `max_tokens`: 200
  - `temperature`: 0.7（創造性とコントロールのバランス）
  - `top_p`: 0.9
- **選択理由**:
  - マネージドサービス、インフラ管理不要
  - 複数モデルから選択可能
  - 日本語対応
  - 従量課金

---

## 3. インフラ技術スタック

### 3.1 Infrastructure as Code

#### AWS CDK (TypeScript)
- **バージョン**: 2.x
- **選択理由**:
  - TypeScript で記述、型安全
  - 高レベル抽象化、コード量削減
  - CloudFormation 自動生成
  - フロントエンドと同じ言語
- **代替案**:
  - CloudFormation: YAML/JSON、冗長
  - Terraform: マルチクラウドだが、AWS 専用なら CDK が最適

### 3.2 ホスティング

#### AWS Amplify Hosting
- **選択理由**:
  - Next.js 対応
  - Git 連携、自動デプロイ
  - HTTPS 自動提供
  - カスタムドメイン対応
  - 従量課金
- **代替案**:
  - S3 + CloudFront: 設定が複雑
  - Vercel: AWS 外のサービス

### 3.3 監視・ログ

#### Amazon CloudWatch
- **CloudWatch Logs**:
  - Lambda 関数のログ
  - 保持期間: 7 日
- **CloudWatch Metrics**:
  - Lambda メトリクス（実行時間、エラー率）
  - API Gateway メトリクス（リクエスト数、レイテンシ）
- **選択理由**:
  - AWS サービスとの統合が標準
  - 追加設定不要
  - 従量課金

**注意**: CloudWatch Alarms、X-Ray は MVP ではスキップ（コスト削減）

---

## 4. 開発ツール

### 4.1 パッケージマネージャー

#### npm
- **バージョン**: 10.x（Node.js 20.x に付属）
- **選択理由**:
  - Node.js 標準、追加インストール不要
  - package-lock.json で依存関係固定
- **代替案**:
  - yarn: 高速だが、追加インストール必要
  - pnpm: ディスク効率的だが、学習コスト

### 4.2 リンター・フォーマッター

#### ESLint
- **バージョン**: 8.x
- **設定**: Next.js 推奨設定 + TypeScript
- **選択理由**:
  - JavaScript/TypeScript 標準リンター
  - Next.js との統合が標準

#### Prettier
- **バージョン**: 3.x
- **選択理由**:
  - コードフォーマット自動化
  - ESLint と統合可能
  - チーム開発でのコード統一

### 4.3 バージョン管理

#### Git + GitHub
- **選択理由**:
  - 業界標準
  - Amplify Hosting との連携
  - ブランチ戦略: feature ブランチ → main

### 4.4 開発環境

#### Node.js
- **バージョン**: 22.x LTS
- **選択理由**:
  - 最新 LTS、長期サポート
  - Lambda ランタイムと一致

#### エディタ
- **推奨**: Visual Studio Code
- **拡張機能**:
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense

---

## 5. 依存ライブラリ

### 5.1 フロントエンド

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "autoprefixer": "^10.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "postcss": "^8.0.0",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 5.2 バックエンド（Lambda）

```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.0.0",
    "@types/node": "^20.0.0",
    "esbuild": "^0.19.0",
    "typescript": "^5.0.0"
  }
}
```

### 5.3 インフラ（CDK）

```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.0.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 6. 技術スタック選択の原則

### 6.1 選択基準
1. **シンプルさ**: 学習コストが低い、設定が少ない
2. **コスト効率**: 従量課金、無料枠の活用
3. **開発速度**: ハッカソン 24 時間で実装可能
4. **AWS 統合**: AWS サービス間の連携が容易
5. **型安全性**: TypeScript で統一

### 6.2 避けた技術
- **GraphQL**: REST API で十分、オーバースペック
- **Redux**: 状態管理が複雑、Context API で十分
- **Docker**: Lambda で不要、デプロイが複雑化
- **RDS**: DynamoDB で十分、コスト高
- **Cognito**: 認証不要（MVP 方針）

### 6.3 将来的な拡張
- **モバイルアプリ**: React Native で同じロジックを再利用
- **認証**: Cognito 追加
- **リアルタイム通知**: AppSync + GraphQL
- **画像生成**: Nova Canvas 統合

---

## 7. 技術スタックサマリー

| レイヤー | 技術 | バージョン | 理由 |
|---|---|---|---|
| **フロントエンド** | Next.js | 14.x | SSR/SSG、ルーティング組み込み |
| **UI** | Tailwind CSS | 3.x | カスタムデザイン容易、軽量 |
| **状態管理** | Context API | - | シンプル、追加ライブラリ不要 |
| **型システム** | TypeScript | 5.x | 型安全性、IDE サポート |
| **バックエンド** | Lambda (Node.js) | 20.x | サーバレス、自動スケール |
| **API** | API Gateway | - | Lambda 統合、HTTPS 自動 |
| **データベース** | DynamoDB | - | サーバレス、低レイテンシ |
| **AI** | Bedrock | - | マネージド、複数モデル |
| **IaC** | AWS CDK | 2.x | TypeScript、高レベル抽象化 |
| **ホスティング** | Amplify Hosting | - | Next.js 対応、自動デプロイ |
| **監視** | CloudWatch | - | AWS 統合、追加設定不要 |

---

**作成日**: 2026-05-03
**バージョン**: 1.0
