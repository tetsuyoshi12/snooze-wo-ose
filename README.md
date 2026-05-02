# スヌーズを押せ

> あなたは、朝起きられますか？

朝起きられない人を生産する、目覚ましアプリの皮を被ったダメ人間製造装置。

雨音と墨絵風の UI とともに、Amazon Bedrock が
詩的・季節的・屁理屈・共犯・科学的根拠の言葉で、
あなたに二度寝を全力で勧めてきます。

30 日連続で二度寝を達成すると、和紙風の卒業証書が発行されます。

---

## これは何

**AWS Summit Japan 2026 AI-DLC ハッカソン**
「AI 時代の新しい開発方法を学びながら『人をダメにする』サービスを考えよう!」
への提出作品です。

開発手法には [AI-DLC（AI-Driven Development Lifecycle）](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/) を採用し、
要件定義から実装まで Kiro IDE × Amazon Bedrock で進めています。

---

## コンセプト

このアプリには三つの層があります。

| 層 | 内容 |
|---|---|
| **表テーマ** | 朝起きられない人を生産する（＝ダメな人を作る） |
| **体験の質感** | 風情あるアンチ効率の演出（雨音、墨絵、季語、待つ時間） |
| **裏のオチ** | 効率化された朝への処方箋。睡眠不足社会の改善、自己肯定感の回復 |

「早起きは三文の得」「朝活」「タイパ」── そんな効率社会の呪いから、
人々をやさしく解き放ちます。立派に、朝起きられない人にします。

---

## 主な機能

- 🌧 **雨音とともに鳴るアラーム** ── 朝が来たことすら愛おしく感じる演出
- 🖋 **AI による五種の二度寝メッセージ**
  - 詩的・文学的に勧める
  - 季語を交えて勧める
  - 屁理屈で勧める
  - 「私も眠い」と共犯になって勧める
  - 長時間睡眠の科学的根拠で正当化する
- 👆 **巨大なスヌーズボタン** ── 押しやすさ最優先。「起きる」は隅に小さく
- 📊 **堕落ゲージ・連続二度寝記録** ── あなたのダメっぷりを可視化
- 🏆 **称号システム** ── 寝坊見習い → 布団仙人 → 夢の住人
- 📜 **30 日卒業証書** ── 和紙風の証書で「立派なダメ人間」認定

---

## 技術スタック

### フロントエンド
- React / Next.js
- AWS Amplify Hosting

### バックエンド
- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB

### 生成 AI
- **Amazon Bedrock**
  - 開発時：Amazon Nova Lite
  - デモ時：Anthropic Claude Haiku / Sonnet
- Amazon Polly（音声合成・Nice-to-have）
- Amazon Nova Canvas（墨絵風背景・卒業証書の事前生成）

### 開発手法
- AI-DLC（AI-Driven Development Lifecycle）
- Kiro IDE

---

## アーキテクチャ

```
[ユーザーのブラウザ]
     │
     ├── 静的ホスティング: AWS Amplify Hosting
     │     （React / Next.js）
     │
     ▼
[Amazon API Gateway]
     │
     ▼
[AWS Lambda]
     │
     ├──→ [Amazon Bedrock]
     │       └─ Nova Lite（開発時） / Claude Haiku or Sonnet（デモ時）
     │
     ├──→ [Amazon DynamoDB]
     │       └─ スヌーズ回数、連続日数、メッセージ履歴
     │
     └──→ [Amazon Polly]   ※ Nice-to-have
             └─ メッセージの音声化
```

---

## セットアップ

### 前提
- Node.js 20 以上
- AWS アカウント
- AWS CLI 設定済み
- Amazon Bedrock のモデルアクセス有効化（Nova Lite / Claude Haiku）

### ローカル起動

```bash
# クローン
git clone https://github.com/tetsuyoshi12/snooze-wo-ose.git
cd snooze-wo-ose

# 依存インストール
npm install

# 環境変数を設定（.env.local を作成）
cp .env.example .env.local
# AWS_REGION や Bedrock のモデル ID などを記入

# 開発サーバ起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### AWS リソースのデプロイ

詳細は `infra/README.md` を参照（実装後に追記）。

---

## デモ

ハッカソン会場でのライブデモ用に、任意のタイミングでアラーム発火を再現できる
**ライブモード**を搭載しています。

設定画面から「デモ起動」ボタンを押すと、5 秒後にアラームが鳴り始めます。

---

## ロードマップ

- [x] アプリ要件定義（AI-DLC Inception フェーズ）
- [ ] MVP 実装（ハッカソン提出）
- [ ] ハッカソン本番（AWS Summit Japan 2026）
- [ ] Web 版の機能拡充（ランキング、SNS シェア）
- [ ] React Native でのモバイル化
- [ ] スマホアラームとの連携
- [ ] App Store / Google Play リリース

---

## 注意事項

- 本アプリは医療助言ではありません。
- 本気で起きる必要がある日は、別のアラームの併用を推奨します。
- 健康に関する内容は、一般に知られた知見のみを使用しています。
- 過度な使用は控えめに。

---

## ライセンス

[MIT License](./LICENSE)

---

## クレジット

- 開発：tetsuyoshi12
- 開発手法：[AI-DLC](https://github.com/awslabs/aidlc-workflows) by AWS Labs
- 生成 AI：Amazon Bedrock
- イベント：AWS Summit Japan 2026 AI-DLC ハッカソン

---

> スヌーズを押せ ── これは、押すべきボタンです。
