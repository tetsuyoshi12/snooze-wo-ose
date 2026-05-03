# フロントエンド実装サマリー

**プロジェクト**: スヌーズを押せ（Snooze Wo Ose）  
**フレームワーク**: Next.js 14.x + TypeScript  
**UI**: Tailwind CSS（墨絵風カスタムデザイン）  
**作成日**: 2026-05-03

---

## 実装概要

Next.js 14 の App Router を使用した、墨絵風デザインの目覚ましアプリケーションです。アラーム設定、AI メッセージ生成、スヌーズ記録、ダッシュボード表示、デモモードの 5 つの主要機能を実装しています。

---

## ディレクトリ構造

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # トップページ（アラーム設定）
│   │   ├── alarm/page.tsx        # アラーム画面
│   │   ├── dashboard/page.tsx    # 記録ダッシュボード
│   │   ├── demo/page.tsx         # デモシナリオ
│   │   ├── layout.tsx            # ルートレイアウト
│   │   └── globals.css           # グローバルスタイル
│   ├── components/
│   │   ├── common/               # 共通コンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Modal.tsx
│   │   ├── modals/               # モーダルコンポーネント
│   │   │   └── CertificateModal.tsx
│   │   └── ErrorBoundary.tsx
│   ├── contexts/                 # React Context
│   │   ├── AlarmContext.tsx
│   │   ├── RecordContext.tsx
│   │   └── DemoContext.tsx
│   ├── lib/                      # ユーティリティ・サービス
│   │   ├── error-handler.ts
│   │   ├── sync-manager.ts
│   │   ├── api-client.ts
│   │   └── alarm-manager.ts
│   ├── constants/                # 定数
│   │   └── fallback-messages.ts
│   └── types/                    # TypeScript 型定義
│       └── index.ts
├── public/                       # 静的ファイル
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local                    # 環境変数
```

---

## 主要コンポーネント

### ページコンポーネント

#### 1. トップページ（page.tsx）
- **機能**: アラーム時刻設定
- **実装**: AlarmContext を使用してアラーム設定を管理
- **UI**: 墨絵風デザイン、時刻入力フォーム

#### 2. アラーム画面（alarm/page.tsx）
- **機能**: アラーム鳴動、AI メッセージ表示、スヌーズ/解除
- **実装**: 
  - generateMessage API 呼び出し（失敗時はフォールバックメッセージ）
  - 巨大スヌーズボタン、小さい起きるボタン
  - try-catch でエラーハンドリング（記録保存失敗時も画面遷移）
- **UI**: 墨絵風背景、メッセージ表示エリア

#### 3. 記録ダッシュボード（dashboard/page.tsx）
- **機能**: スヌーズ記録表示、堕落ゲージ、連続二度寝記録
- **実装**: RecordContext から記録データを取得、集計表示
- **UI**: 墨絵風グラフ、記録リスト

#### 4. デモシナリオ（demo/page.tsx）
- **機能**: ライブデモ用の自動進行モード
- **実装**: DemoContext を使用してデモデータを管理
- **UI**: 自動進行、スキップ可能

### Context

#### AlarmContext
- **責務**: アラーム設定の管理、スヌーズ/解除処理
- **状態**: alarmConfig, isRinging, snoozeCount
- **メソッド**: setAlarm, snooze, dismiss

#### RecordContext
- **責務**: スヌーズ記録の管理、同期
- **状態**: records, loading
- **メソッド**: addRecord, fetchRecords, syncRecords

#### DemoContext
- **責務**: デモモードの管理
- **状態**: demoData, currentStep
- **メソッド**: startDemo, nextStep, skipDemo

### ユーティリティ・サービス

#### error-handler.ts
- **機能**: エラーハンドリング、タイムアウト、リトライ
- **実装**: AbortController でタイムアウト、指数バックオフでリトライ

#### sync-manager.ts
- **機能**: ローカルストレージと DynamoDB の同期
- **実装**: localStorage に保存、オンライン復帰時に同期

#### api-client.ts
- **機能**: API 呼び出し（メッセージ生成、記録保存・取得）
- **実装**: fetch API、error-handler を使用

#### alarm-manager.ts
- **機能**: アラーム鳴動、通知表示
- **実装**: Web Notifications API、Audio API

---

## 環境変数

```bash
# frontend/.env.local
NEXT_PUBLIC_API_ENDPOINT=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
```

**設定方法**: CDK デプロイ後に出力される API Gateway URL を設定

---

## 依存関係

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

---

## ビルドとデプロイ

### ローカル開発

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く

### 本番ビルド

```bash
npm run build
npm start
```

### Amplify Hosting デプロイ

詳細は `deployment-guide.md` を参照

---

## 実装のポイント

### 1. エラーハンドリング
- API 失敗時はフォールバックメッセージを表示（F-03 受入基準）
- 記録保存失敗時も画面遷移を確実に実行（try-catch）

### 2. オフライン対応
- localStorage にローカル保存
- オンライン復帰時に DynamoDB と同期

### 3. 墨絵風デザイン
- Tailwind CSS でカスタムカラー定義（ink-*, paper）
- 日本語フォント（Noto Serif JP）
- 和風 UI コンポーネント

### 4. パフォーマンス最適化
- Next.js の SSR/SSG 活用
- 画像最適化（next/image）
- コード分割（dynamic import）

---

## テスト

### 動作確認項目

- [ ] アラーム時刻設定が正常に動作する
- [ ] アラーム鳴動時に AI メッセージが表示される
- [ ] API 失敗時にフォールバックメッセージが表示される
- [ ] スヌーズボタンで記録が保存される
- [ ] 起きるボタンでアラームが停止する
- [ ] ダッシュボードで記録が表示される
- [ ] デモモードが正常に動作する

---

**作成日**: 2026-05-03  
**バージョン**: 1.0
