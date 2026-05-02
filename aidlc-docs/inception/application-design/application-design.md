# アプリケーション設計 - 総合設計書

このドキュメントは、「スヌーズを押せ」Web アプリケーションの総合的なアプリケーション設計をまとめたものです。

---

## 目次

1. [設計概要](#1-設計概要)
2. [アーキテクチャ概要](#2-アーキテクチャ概要)
3. [コンポーネント定義](#3-コンポーネント定義)
4. [コンポーネントメソッド](#4-コンポーネントメソッド)
5. [サービスレイヤー](#5-サービスレイヤー)
6. [依存関係と通信パターン](#6-依存関係と通信パターン)
7. [設計原則](#7-設計原則)

---

## 1. 設計概要

### 1.1 プロジェクト概要
- **プロジェクト名**: スヌーズを押せ
- **目的**: 目覚ましアプリの形をした「朝起きられない人を生産する」サービス
- **技術スタック**: AWS サーバレス（Lambda, API Gateway, Bedrock, DynamoDB, Amplify）
- **開発期間**: ハッカソン 24 時間

### 1.2 設計方針
- **フロントエンド**: ページベース構成、React State + ローカルストレージ、Context API、Tailwind CSS
- **バックエンド**: 機能ごとに Lambda 関数を分離
- **データ**: ハイブリッド（ローカルストレージ + DynamoDB）
- **インフラ**: AWS CDK で管理

### 1.3 設計目標
- **シンプル**: ハッカソン 24 時間で実装可能な設計
- **拡張性**: 将来的なモバイルアプリ化を考慮
- **オフライン対応**: ローカルストレージでオフライン動作
- **コスト効率**: サーバレスで低コスト運用

---

## 2. アーキテクチャ概要

### 2.1 システムアーキテクチャ

```
+--------------------------------------------------+
|              ユーザー（ブラウザ）                  |
+--------------------------------------------------+
                      |
                      | HTTPS
                      v
+--------------------------------------------------+
|           AWS Amplify (静的ホスティング)           |
|  +--------------------------------------------+  |
|  |         React SPA (フロントエンド)          |  |
|  |  - AlarmSettingPage                        |  |
|  |  - AlarmScreen                             |  |
|  |  - RecordDashboard                         |  |
|  |  - DemoScenario                            |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
                      |
                      | REST API (HTTPS)
                      v
+--------------------------------------------------+
|              API Gateway (REST API)              |
+--------------------------------------------------+
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
+-------------+ +-------------+ +-------------+
|  Message    | |  Record     | |  Alarm      |
|  Generator  | |  Manager    | |  Config     |
|  Function   | |  Function   | |  Function   |
+-------------+ +-------------+ +-------------+
        |             |             |
        v             v             v
+-------------+ +---------------------------+
|   Amazon    | |        DynamoDB           |
|   Bedrock   | |  - SnoozeRecords         |
|             | |  - AlarmConfigs          |
+-------------+ +---------------------------+
```

### 2.2 レイヤー構造

```
+---------------------------------------------------+
|              Presentation Layer                   |
|  (ページコンポーネント、モーダル、共通コンポーネント)  |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|                 Service Layer                     |
|  (AlarmManager, StorageManager, MessageService)   |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|                   API Layer                       |
|         (API Gateway, Lambda Functions)           |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|                  Data Layer                       |
|      (DynamoDB, localStorage, Amazon Bedrock)     |
+---------------------------------------------------+
```

---

## 3. コンポーネント定義

### 3.1 フロントエンドコンポーネント（10 個）

#### ページコンポーネント（4 個）
1. **AlarmSettingPage**: アラーム時刻の設定と管理
2. **AlarmScreen**: アラーム鳴動時の画面（墨絵風 UI + AI メッセージ）
3. **RecordDashboard**: スヌーズ記録、堕落ゲージ、連続記録の表示
4. **DemoScenario**: ハッカソン審査員向けデモシナリオ

#### モーダルコンポーネント（2 個）
5. **CertificateModal**: 30 日卒業証書の表示
6. **MessageHistoryModal**: 過去の AI メッセージ履歴（Nice-to-have）

#### サービスコンポーネント（4 個）
7. **AlarmManager**: アラーム機能の中核ロジック
8. **StorageManager**: ローカルストレージとの同期管理
9. **ErrorBoundary**: グローバルエラーハンドリング
10. **AppLayout**: アプリケーション全体のレイアウト

### 3.2 バックエンドコンポーネント（3 個）

11. **MessageGeneratorFunction**: AI メッセージ生成 Lambda 関数
12. **RecordManagerFunction**: スヌーズ記録管理 Lambda 関数
13. **AlarmConfigFunction**: アラーム設定管理 Lambda 関数（将来拡張用）

### 3.3 共通コンポーネント（3 個）

14. **Button**: 再利用可能なボタンコンポーネント
15. **ProgressBar**: 堕落ゲージなどの進捗表示
16. **Modal**: 汎用モーダルコンポーネント

**合計**: 16 個のコンポーネント

詳細は [`components.md`](./components.md) を参照してください。

---

## 4. コンポーネントメソッド

各コンポーネントの主要メソッドシグネチャ、入出力タイプ、高レベル目的を定義しています。

### 4.1 主要メソッド例

#### AlarmManager
- `setAlarm(time: string): void` - アラームをスケジュール
- `snooze(minutes: number): void` - スヌーズ処理
- `triggerAlarm(): Promise<void>` - アラームを鳴動

#### MessageGeneratorFunction
- `handler(event): Promise<APIGatewayProxyResult>` - Lambda エントリーポイント
- `generateMessage(pattern, context): Promise<string>` - AI メッセージ生成
- `callBedrock(prompt): Promise<string>` - Bedrock API 呼び出し

#### RecordManagerFunction
- `handler(event): Promise<APIGatewayProxyResult>` - Lambda エントリーポイント
- `saveRecord(record): Promise<boolean>` - 記録保存
- `calculateGauge(records): number` - 堕落ゲージ計算

詳細は [`component-methods.md`](./component-methods.md) を参照してください。

---

## 5. サービスレイヤー

### 5.1 フロントエンドサービス

#### AlarmService
- **責務**: アラーム機能の中核ロジック管理
- **提供機能**: スケジューリング、スヌーズ、停止、通知制御、デモモード

#### MessageService
- **責務**: AI メッセージの取得と管理
- **提供機能**: Lambda 呼び出し、キャッシュ管理、履歴保存、エラーハンドリング

#### RecordService
- **責務**: スヌーズ記録の管理と分析
- **提供機能**: 記録保存/取得、ゲージ計算、連続記録更新、称号判定

#### StorageService
- **責務**: データの永続化と同期
- **提供機能**: ローカルストレージ読み書き、DynamoDB 同期、オフライン対応

#### NotificationService
- **責務**: Web Notifications API の管理
- **提供機能**: 通知権限リクエスト、通知表示、クリックハンドリング

#### DemoService
- **責務**: デモモードの制御
- **提供機能**: デモシナリオ実行、デモデータ管理、自動進行

### 5.2 バックエンドサービス

#### MessageGeneratorService
- **責務**: AI メッセージの生成
- **提供機能**: Bedrock API 呼び出し、プロンプト構築、パターン選択

#### RecordManagerService
- **責務**: スヌーズ記録の管理
- **提供機能**: DynamoDB 保存/取得、ゲージ計算、連続記録更新

#### AlarmConfigService
- **責務**: アラーム設定の管理（将来拡張用）
- **提供機能**: 設定保存/取得、複数アラーム管理

### 5.3 データサービス

#### DynamoDB テーブル
- **SnoozeRecords**: スヌーズ記録を保存
  - Partition Key: `userId`
  - Sort Key: `timestamp`
- **AlarmConfigs**: アラーム設定を保存
  - Partition Key: `userId`

詳細は [`services.md`](./services.md) を参照してください。

---

## 6. 依存関係と通信パターン

### 6.1 依存関係マトリックス

主要な依存関係：
- **AlarmScreen** → MessageGeneratorFunction, RecordManagerFunction
- **RecordDashboard** → RecordManagerFunction, StorageManager
- **AlarmManager** → StorageManager, MessageGeneratorFunction, RecordManagerFunction
- **StorageManager** → RecordManagerFunction, AlarmConfigFunction

### 6.2 通信パターン

#### Context API による状態共有
```
AlarmContext → AlarmSettingPage, AlarmScreen, AlarmManager
RecordContext → RecordDashboard, AlarmScreen
DemoContext → DemoScenario, AlarmSettingPage
```

#### REST API 呼び出し
```
Frontend → API Gateway → Lambda Function → AWS Service
```

#### ローカルストレージ
```
Component → StorageManager → localStorage
```

### 6.3 データフロー

#### アラーム鳴動フロー
```
setTimeout 満了
  → AlarmManager.triggerAlarm()
  → MessageGeneratorFunction (AI メッセージ生成)
  → AlarmScreen 表示
```

#### スヌーズフロー
```
ユーザー（スヌーズボタン）
  → AlarmScreen.handleSnooze()
  → AlarmManager.snooze()
  → RecordManagerFunction (記録保存)
  → 次のアラームをスケジュール
```

詳細は [`component-dependency.md`](./component-dependency.md) を参照してください。

---

## 7. 設計原則

### 7.1 SOLID 原則

#### 単一責任の原則（SRP）
- 各コンポーネントは単一の責務を持つ
- 例: AlarmManager はアラーム管理のみ、StorageManager はストレージ管理のみ

#### 開放閉鎖の原則（OCP）
- 拡張に対して開いている、修正に対して閉じている
- 例: 新しいメッセージパターンを追加しても既存コードを変更しない

#### リスコフの置換原則（LSP）
- サブクラスは基底クラスと置き換え可能
- 例: MockStorageManager は StorageManager と置き換え可能

#### インターフェース分離の原則（ISP）
- クライアントは使用しないメソッドに依存しない
- 例: MessageService は必要なメソッドのみを公開

#### 依存性逆転の原則（DIP）
- 上位モジュールは下位モジュールに依存しない
- 例: AlarmManager は StorageManager インターフェースに依存

### 7.2 設計パターン

#### Observer パターン
- Context API による状態変更の通知
- 例: AlarmContext の変更を複数のコンポーネントが監視

#### Strategy パターン
- AI メッセージ生成のパターン選択
- 例: 5 つのパターンから動的に選択

#### Facade パターン
- サービスレイヤーが複雑な処理を隠蔽
- 例: AlarmManager が複数のサービスを統合

#### Repository パターン
- データアクセスの抽象化
- 例: StorageManager がローカルストレージと DynamoDB を抽象化

### 7.3 コーディング規約

#### 命名規則
- **コンポーネント**: PascalCase（例: AlarmSettingPage）
- **メソッド**: camelCase（例: setAlarm）
- **定数**: UPPER_SNAKE_CASE（例: MAX_SNOOZE_COUNT）
- **ファイル**: kebab-case（例: alarm-setting-page.tsx）

#### ファイル構成
```
src/
├── components/
│   ├── pages/
│   ├── modals/
│   └── common/
├── services/
├── contexts/
├── utils/
└── types/
```

#### コメント規約
- JSDoc 形式でメソッドにコメント
- 複雑なロジックには説明コメント
- TODO コメントは Issue 番号を含める

### 7.4 エラーハンドリング戦略

#### フロントエンド
- React Error Boundary でコンポーネントエラーをキャッチ
- Try-Catch で非同期処理のエラーをキャッチ
- フォールバック UI を提供

#### バックエンド
- Lambda 関数で try-catch
- CloudWatch Logs にエラーログ記録
- 適切な HTTP ステータスコードを返す

### 7.5 パフォーマンス最適化

#### フロントエンド
- コンポーネントの遅延ロード
- React.memo、useMemo、useCallback の活用
- メッセージ履歴のキャッシュ

#### バックエンド
- Lambda Provisioned Concurrency（本番環境）
- DynamoDB の適切なキー設計
- Bedrock 軽量モデル（Nova Lite）の優先使用

### 7.6 セキュリティ考慮事項

#### データセキュリティ
- ローカルストレージには機密情報を保存しない
- DynamoDB は暗号化有効化
- API Gateway は HTTPS のみ

#### 認証・認可
- MVP では認証なし（ローカルストレージベース）
- 将来的に Cognito による認証を追加予定

---

## 8. 設計の妥当性検証

### 8.1 要件との対応

| 要件 | 対応コンポーネント | 実装方法 |
|---|---|---|
| アラーム設定 | AlarmSettingPage, AlarmManager | Context API + localStorage |
| AI メッセージ生成 | MessageGeneratorFunction | Amazon Bedrock |
| スヌーズ記録 | RecordManagerFunction | DynamoDB + localStorage |
| 堕落ゲージ | RecordDashboard | 記録データから計算 |
| 卒業証書 | CertificateModal | 30 日達成時に表示 |
| デモモード | DemoScenario | 事前データで自動進行 |

### 8.2 非機能要件との対応

| 非機能要件 | 対応方法 |
|---|---|
| パフォーマンス | サーバレス、軽量モデル、キャッシュ |
| 可用性 | AWS サーバレス、オフライン対応 |
| スケーラビリティ | Lambda 自動スケール、DynamoDB オンデマンド |
| セキュリティ | HTTPS、DynamoDB 暗号化 |
| コスト効率 | サーバレス、従量課金 |

### 8.3 拡張性の検証

#### 将来的な拡張
- **モバイルアプリ化**: React Native で同じロジックを再利用
- **複数アラーム**: AlarmConfigFunction で管理
- **ユーザー認証**: Cognito 追加
- **ソーシャル機能**: 記録の共有、ランキング

---

## 9. 次のステップ

### 9.1 CONSTRUCTION フェーズへの移行

アプリケーション設計が完了したら、次のステージに進みます：

1. **NFR 要件**: 非機能要件の詳細化
2. **NFR 設計**: NFR パターンの組み込み
3. **インフラ設計**: AWS リソースの具体的な設計
4. **コード生成**: 実装コードの生成

### 9.2 設計レビューのポイント

- コンポーネント責務の明確性
- 依存関係の適切性
- エラーハンドリングの網羅性
- パフォーマンスの考慮
- セキュリティの考慮

---

## 10. 参考資料

### 10.1 関連ドキュメント
- [`components.md`](./components.md) - コンポーネント定義の詳細
- [`component-methods.md`](./component-methods.md) - メソッドシグネチャの詳細
- [`services.md`](./services.md) - サービスレイヤーの詳細
- [`component-dependency.md`](./component-dependency.md) - 依存関係の詳細

### 10.2 外部リンク
- [React 公式ドキュメント](https://react.dev/)
- [AWS Lambda 開発者ガイド](https://docs.aws.amazon.com/lambda/)
- [Amazon Bedrock ドキュメント](https://docs.aws.amazon.com/bedrock/)
- [DynamoDB 開発者ガイド](https://docs.aws.amazon.com/dynamodb/)

---

**作成日**: 2026-05-03
**バージョン**: 1.0
**ステータス**: レビュー待ち
