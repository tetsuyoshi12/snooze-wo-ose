# コード生成計画

**プロジェクト**: スヌーズを押せ（Snooze Wo Ose）
**フェーズ**: CONSTRUCTION - コード生成（Part 1: Planning）
**作成日**: 2026-05-03
**バージョン**: 1.0

---

## 計画の目的

この計画は、「スヌーズを押せ」Web アプリケーションの完全な実装コードを生成するための詳細なステップバイステップガイドです。

**重要な方針**:
1. 設計成果物（components.md, services.md, tech-stack-decisions.md, infrastructure-design.md など）を忠実に実装
2. MVP 機能（F-01〜F-08）のみ実装（Nice-to-have は実装しない）
3. ファイル構成は tech-stack-decisions.md と application-design.md に従う
4. TypeScript 型定義は component-methods.md の定義を使用
5. テストコードは最小限（動作確認できる程度）
6. コメントは適度に（「なぜそうしているか」を残す）
7. Bedrock プロンプトは 5 パターンすべて実装

---

## コード配置場所

**ワークスペースルート**: `/workspaces/snooze-wo-ose/`（aidlc-state.md から確認済み）

**コード配置ルール**:
- **アプリケーションコード**: ワークスペースルート直下（NEVER aidlc-docs/）
- **ドキュメント**: aidlc-docs/ のみ（markdown サマリー）

---

## プロジェクト構造

```
snooze-wo-ose/                    # ワークスペースルート
├── frontend/                     # フロントエンドコード（Next.js）
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── page.tsx          # トップページ（アラーム設定）
│   │   │   ├── alarm/
│   │   │   │   └── page.tsx     # アラーム画面
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # 記録ダッシュボード
│   │   │   ├── demo/
│   │   │   │   └── page.tsx     # デモシナリオ
│   │   │   ├── layout.tsx        # ルートレイアウト
│   │   │   └── globals.css       # グローバルスタイル
│   │   ├── components/
│   │   │   ├── pages/            # ページコンポーネント
│   │   │   ├── modals/           # モーダルコンポーネント
│   │   │   └── common/           # 共通コンポーネント
│   │   ├── lib/                  # ユーティリティ・サービス
│   │   │   ├── error-handler.ts
│   │   │   ├── sync-manager.ts
│   │   │   └── api-client.ts
│   │   ├── contexts/             # React Context
│   │   │   ├── AlarmContext.tsx
│   │   │   ├── RecordContext.tsx
│   │   │   └── DemoContext.tsx
│   │   ├── constants/            # 定数
│   │   │   └── fallback-messages.ts
│   │   └── types/                # TypeScript 型定義
│   │       └── index.ts
│   ├── public/                   # 静的ファイル
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.local
│
├── lambda/                       # Lambda 関数コード
│   ├── message-generator/
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── record-manager/
│       ├── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── cdk/                          # CDK インフラコード
│   ├── bin/
│   │   └── snooze-wo-ose.ts
│   ├── lib/
│   │   └── snooze-wo-ose-stack.ts
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
│
├── aidlc-docs/                   # AI-DLC ドキュメント（既存）
│   └── construction/
│       └── code/                 # コード生成サマリー（markdown のみ）
│
├── .gitignore
├── README.md
└── package.json                  # ルート package.json（ワークスペース管理用）
```

---

## 生成ステップ一覧

### ステップ 1: プロジェクト構造セットアップ
- [x] ルート package.json 作成（ワークスペース管理）
- [x] .gitignore 作成
- [x] README.md は既存を保持（上書きしない）

### ステップ 2: フロントエンド - プロジェクト初期化
- [x] frontend/ ディレクトリ作成
- [x] frontend/package.json 作成
- [x] frontend/next.config.js 作成
- [x] frontend/tailwind.config.js 作成
- [x] frontend/tsconfig.json 作成
- [x] frontend/.env.local 作成
- [x] frontend/postcss.config.js 作成
- [x] frontend/.eslintrc.json 作成
- [x] frontend/.prettierrc 作成

**ステップ 2 完了 - ここで一時停止**

### ステップ 3: フロントエンド - 型定義
- [x] frontend/src/types/index.ts 作成（component-methods.md の型定義を使用）

### ステップ 4: フロントエンド - 定数
- [x] frontend/src/constants/fallback-messages.ts 作成

### ステップ 5: フロントエンド - ユーティリティ・サービス
- [x] frontend/src/lib/error-handler.ts 作成
- [x] frontend/src/lib/sync-manager.ts 作成
- [x] frontend/src/lib/api-client.ts 作成
- [x] frontend/src/lib/alarm-manager.ts 作成

### ステップ 6: フロントエンド - Context
- [x] frontend/src/contexts/AlarmContext.tsx 作成
- [x] frontend/src/contexts/RecordContext.tsx 作成
- [x] frontend/src/contexts/DemoContext.tsx 作成

### ステップ 7: フロントエンド - 共通コンポーネント
- [x] frontend/src/components/common/Button.tsx 作成
- [x] frontend/src/components/common/ProgressBar.tsx 作成
- [x] frontend/src/components/common/Modal.tsx 作成
- [x] frontend/src/components/ErrorBoundary.tsx 作成

### ステップ 8: フロントエンド - モーダルコンポーネント
- [x] frontend/src/components/modals/CertificateModal.tsx 作成

### ステップ 9: フロントエンド - ページコンポーネント
- [x] frontend/src/app/layout.tsx 作成（AppLayout）
- [x] frontend/src/app/page.tsx 作成（AlarmSettingPage）
- [x] frontend/src/app/alarm/page.tsx 作成（AlarmScreen）
- [x] frontend/src/app/dashboard/page.tsx 作成（RecordDashboard）
- [x] frontend/src/app/demo/page.tsx 作成（DemoScenario）

### ステップ 10: フロントエンド - グローバルスタイル
- [x] frontend/src/app/globals.css 作成（Tailwind CSS + 墨絵風カスタムスタイル）

**ステップ 3-10 完了 - フロントエンド実装完了**

### ステップ 11: Lambda 関数 - messageGenerator
- [x] lambda/message-generator/index.ts 作成（5 パターンのプロンプト実装）
- [x] lambda/message-generator/package.json 作成
- [x] lambda/message-generator/tsconfig.json 作成

### ステップ 12: Lambda 関数 - recordManager
- [x] lambda/record-manager/index.ts 作成
- [x] lambda/record-manager/package.json 作成
- [x] lambda/record-manager/tsconfig.json 作成

### ステップ 13: CDK インフラ - プロジェクト初期化
- [x] cdk/package.json 作成
- [x] cdk/cdk.json 作成
- [x] cdk/tsconfig.json 作成
- [x] cdk/bin/snooze-wo-ose.ts 作成（エントリーポイント）

### ステップ 14: CDK インフラ - スタック定義
- [x] cdk/lib/snooze-wo-ose-stack.ts 作成
- [x] cdk/bin/snooze-wo-ose.ts 作成

### ステップ 15: ドキュメント生成
- [x] aidlc-docs/construction/code/frontend-summary.md 作成
- [x] aidlc-docs/construction/code/lambda-summary.md 作成
- [x] aidlc-docs/construction/code/cdk-summary.md 作成
- [x] aidlc-docs/construction/code/deployment-guide.md 作成

---

## 実装詳細

### MVP 機能マッピング

| 機能 ID | 機能名 | 実装場所 |
|---|---|---|
| F-01 | アラーム時刻設定 | frontend/src/app/page.tsx, AlarmContext |
| F-02 | アラーム鳴動 | frontend/src/lib/alarm-manager.ts, AlarmContext |
| F-03 | AI メッセージ生成 | lambda/message-generator/index.ts |
| F-04 | 巨大スヌーズ UI | frontend/src/app/alarm/page.tsx |
| F-05 | スヌーズ記録 | lambda/record-manager/index.ts, SyncManager |
| F-06 | 堕落ゲージ表示 | frontend/src/app/dashboard/page.tsx |
| F-07 | 連続二度寝記録 | frontend/src/app/dashboard/page.tsx |
| F-08 | デモ用ライブモード | frontend/src/app/demo/page.tsx, DemoContext |

### Bedrock プロンプト 5 パターン

**重要**: Claude 4.5 系モデルは推論プロファイル経由でのみ呼び出し可能です。モデル ID には `us.` プレフィックスが必須です。

- **Claude Haiku 4.5**: `us.anthropic.claude-haiku-4-5-20251001-v1:0`（推論プロファイル経由）
- **Nova Lite**: `amazon.nova-lite-v1:0`（オンデマンド対応、prefix 不要）

```typescript
// lambda/message-generator/index.ts で実装

const PROMPTS: Record<string, string> = {
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
```

### TypeScript 型定義（component-methods.md から）

```typescript
// frontend/src/types/index.ts

export interface RecordData {
  userId: string;
  timestamp: string;
  action: 'snooze' | 'dismiss';
  messageId: string;
  pattern: string;
}

export interface AlarmConfig {
  userId: string;
  alarmTime: string;
  isEnabled: boolean;
  snoozeInterval: number;
}

export interface MessageContext {
  date?: string;
  weather?: string;
}

export interface DemoData {
  messages: string[];
  records: RecordData[];
  gauge: number;
  consecutiveDays: number;
}

export interface Message {
  messageId: string;
  pattern: string;
  text: string;
  timestamp: string;
}
```

### 環境変数

```bash
# frontend/.env.local
NEXT_PUBLIC_API_ENDPOINT=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
```

---

## テスト戦略

### 最小限のテスト（動作確認レベル）

1. **フロントエンド**:
   - ErrorHandler のタイムアウト・リトライ動作確認
   - SyncManager のローカルストレージ保存・読み込み確認
   - アラーム鳴動の動作確認（手動テスト）

2. **Lambda 関数**:
   - messageGenerator: 5 パターンすべてのプロンプトが動作することを確認
   - recordManager: 保存・取得が正しく動作することを確認

3. **統合テスト**:
   - フロントエンド → API Gateway → Lambda → Bedrock の一連の流れ
   - フロントエンド → API Gateway → Lambda → DynamoDB の一連の流れ

---

## コメント方針

**適度なコメント**:
- 複雑なロジックには「なぜそうしているか」を説明
- 設計意図が明確でない箇所にコメント
- プロンプト構築ロジックには詳細なコメント
- 過度なコメントは避ける（コードが自己説明的であることを優先）

**例**:
```typescript
// AbortController でタイムアウトを実装
// fetch API の標準機能を使用し、追加ライブラリ不要
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
```

---

## 依存関係

### フロントエンド（frontend/package.json）

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
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

### Lambda 関数（lambda/*/package.json）

```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.0.0",
    "@types/node": "^22.0.0",
    "esbuild": "^0.19.0",
    "typescript": "^5.0.0"
  }
}
```

### CDK（cdk/package.json）

```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.0.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 完了基準

### Part 1（Planning）完了基準
- [x] 詳細なコード生成計画が作成されている
- [x] すべてのステップにチェックボックスがある
- [x] ファイル構成が明確に定義されている
- [x] MVP 機能マッピングが完了している
- [x] 型定義が component-methods.md から抽出されている
- [x] Bedrock プロンプト 5 パターンが定義されている
- [ ] ユーザーが計画を承認している

### Part 2（Generation）完了基準
- [ ] すべてのステップが [x] になっている
- [ ] すべてのファイルが正しい場所に生成されている
- [ ] コードが設計成果物を忠実に実装している
- [ ] MVP 機能（F-01〜F-08）がすべて実装されている
- [ ] TypeScript 型定義が component-methods.md の定義と一致している
- [ ] Bedrock プロンプト 5 パターンがすべて実装されている
- [ ] テストコードが最小限含まれている
- [ ] コメントが適度に含まれている
- [ ] ドキュメントサマリーが生成されている

---

**計画作成日**: 2026-05-03
**次のステップ**: ユーザー承認を待ち、Part 2（Generation）に進む
