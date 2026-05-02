# インフラ設計計画

## 目的
論理コンポーネントを実際の AWS インフラサービスにマッピングし、デプロイ可能な構成を定義する。

**軽量化方針**: 
- AWS CDK (TypeScript) で記述
- ハッカソン MVP に必要な最小限のリソース定義
- Lambda 関数 2 つ（messageGenerator, recordManager）※ AlarmConfigFunction は将来用としてスキップ
- シンプルな単一スタック構成
- IAM ロールは最小権限の原則で、ただし複雑にしすぎない

## 前提条件
- NFR 設計が完了している
- 実行計画でインフラ設計ステージの実行が指示されている

---

## ステップバイステップ実行

### ステップ 1: 既存設計の確認
- [x] NFR 要件を確認
- [x] NFR 設計パターンを確認
- [x] アプリケーション設計を確認
- [x] 必要なインフラコンポーネントを特定

### ステップ 2: MVP に必要なリソースの特定
- [x] Lambda 関数 2 つ（messageGenerator, recordManager）
- [x] API Gateway（REST API）
- [x] DynamoDB（SnoozeRecords テーブルのみ）
- [x] Amplify Hosting
- [x] CloudWatch Logs（7 日保持）
- [x] IAM ロール（最小権限）

### ステップ 3: インフラ設計計画の作成
- [x] チェックボックス付きのインフラ設計計画を生成
- [x] AWS CDK での実装を前提
- [x] 各ステップにチェックボックス [] を付ける

### ステップ 4: コンテキストに適した質問の生成

**指示**: NFR 要件と設計を確認し、インフラ実装に必要な事項のみを質問します。

- [Answer]: タグ形式を使用して質問を埋め込む
- MVP に必要な最小限のリソースに焦点
- **疑問がある場合は質問する**

**評価する質問カテゴリ**（必要な場合のみ）：
- **Lambda 関数設定** - メモリ、タイムアウト、環境変数、ランタイム
- **API Gateway 設定** - CORS、認証、ステージ、スロットリング
- **DynamoDB 設定** - キャパシティモード、キー設計、暗号化
- **Amplify Hosting 設定** - ビルド設定、環境変数、カスタムドメイン
- **CloudWatch Logs 設定** - 保持期間、ログレベル
- **IAM ロール設計** - 最小権限の具体的な範囲

### ステップ 5: 計画の保存
- [x] `aidlc-docs/construction/plans/infrastructure-design-plan.md` として保存
- [x] ユーザー入力用のすべての [Answer]: タグを含める

### ステップ 6: ユーザー入力のリクエスト
- [ ] ユーザーに質問ファイル内の [Answer]: タグを直接記入するよう依頼

### ステップ 7: 回答の収集と分析
- [ ] ユーザーが [Answer]: タグを使用してすべての質問に回答するまで待機
- [ ] 曖昧な回答があれば追加質問

### ステップ 8: インフラ設計成果物の生成
- [x] 以下を含む `aidlc-docs/construction/infrastructure-design/infrastructure-design.md` を作成：
  - Lambda 関数定義（messageGenerator, recordManager）
  - API Gateway 定義（エンドポイント、CORS、認証）
  - DynamoDB テーブル定義（SnoozeRecords）
  - Amplify Hosting 設定
  - CloudWatch Logs 設定
  - IAM ロール定義
- [x] 以下を含む `aidlc-docs/construction/infrastructure-design/deployment-architecture.md` を作成：
  - デプロイメントアーキテクチャ図
  - リソース間の接続
  - データフロー
  - セキュリティグループ設定（該当する場合）
- [x] 以下を含む `aidlc-docs/construction/infrastructure-design/cdk-structure.md` を作成：
  - CDK プロジェクト構造
  - スタック定義
  - コンストラクト構成
  - デプロイ手順

### ステップ 9: 承認のログ記録と完了メッセージの提示
- [ ] 承認を求める前に、タイムスタンプ付きでプロンプトを audit.md に記録
- [ ] 標準化された 2 オプション完了メッセージを提示

### ステップ 10: 明示的承認を待つ
- [ ] ユーザーがインフラ設計を明示的に承認するまで進まない

### ステップ 11: 承認応答の記録と進捗の更新
- [ ] タイムスタンプ付きでユーザーの承認応答を `aidlc-docs/audit.md` に記録
- [ ] `aidlc-docs/aidlc-state.md` でインフラ設計ステージを完了としてマーク

---

## 重要なルール

### 軽量化原則
- **AWS CDK (TypeScript)**: インフラをコードで管理
- **単一スタック**: 過度な分割を避け、シンプルな構成
- **最小限のリソース**: MVP に必要なもののみ
- **Lambda 2 つのみ**: messageGenerator, recordManager（AlarmConfig は将来用）
- **DynamoDB 1 テーブル**: SnoozeRecords のみ（AlarmConfigs は将来用）

### 設計原則
- **シンプル**: 複雑な構成は避ける
- **実装可能**: 24 時間で実装できる
- **具体的**: CDK コードの構造を明確にする
- **最小権限**: IAM ロールは必要最小限の権限のみ

---

**計画作成日**: 2026-05-03
**バージョン**: 1.0
