# インフラ設計 - 質問

このドキュメントには、インフラ設計に必要な質問が含まれています。
各質問の [Answer]: タグの後に、選択肢の文字（A, B, C, D, E など）を記入してください。

---

## 質問 1: Lambda 関数のランタイムバージョン
Lambda 関数のランタイムバージョンを選択してください。

A) Node.js 18.x（LTS、安定版）
B) Node.js 20.x（最新版、長期サポート開始）
C) Node.js 22.x（最新版、実験的）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: B

---

## 質問 2: API Gateway のステージ名
API Gateway のステージ名を選択してください。

A) prod（本番環境）
B) dev（開発環境）
C) demo（デモ環境）
D) v1（バージョン管理）
E) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 3: API Gateway のスロットリング設定
API Gateway のスロットリング（リクエスト制限）を設定しますか？

A) 設定する（バーストリミット: 100、レートリミット: 50 req/sec）
B) 設定する（バーストリミット: 500、レートリミット: 200 req/sec）
C) 設定しない（デフォルト制限を使用）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: C

---

## 質問 4: Amplify Hosting のビルドコマンド
Amplify Hosting のビルドコマンドを選択してください。

A) npm run build（Next.js の標準ビルド）
B) npm run build && npm run export（静的エクスポート）
C) カスタムビルドコマンド（[Answer]: タグの後に記述してください）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 5: Amplify Hosting の環境変数
Amplify Hosting に設定する環境変数はありますか？

A) API Gateway のエンドポイント URL のみ
B) API Gateway のエンドポイント URL + Bedrock モデル ID
C) 環境変数は不要（ハードコード）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 6: DynamoDB のバックアップ設定
DynamoDB のバックアップを設定しますか？

A) ポイントインタイムリカバリ（PITR）を有効化
B) オンデマンドバックアップのみ
C) バックアップ不要（ハッカソン MVP のため）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: C

---

## 質問 7: CloudWatch Logs のログストリーム
CloudWatch Logs のログストリームをどのように構成しますか？

A) Lambda 関数ごとに自動作成（デフォルト）
B) カスタムログストリーム名を指定
C) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 8: IAM ロールの Bedrock アクセス権限
messageGenerator Lambda の IAM ロールに付与する Bedrock アクセス権限を選択してください。

A) bedrock:InvokeModel のみ（最小権限）
B) bedrock:InvokeModel + bedrock:InvokeModelWithResponseStream（ストリーミング対応）
C) bedrock:* （すべての Bedrock アクション）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 9: IAM ロールの DynamoDB アクセス権限
recordManager Lambda の IAM ロールに付与する DynamoDB アクセス権限を選択してください。

A) dynamodb:PutItem + dynamodb:GetItem + dynamodb:Query（最小権限）
B) dynamodb:PutItem + dynamodb:GetItem + dynamodb:Query + dynamodb:Scan
C) dynamodb:* （すべての DynamoDB アクション）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 10: CDK スタック名
CDK スタックの名前を選択してください。

A) SnoozeWoOseStack（プロジェクト名ベース）
B) SnoozeAppStack（シンプル）
C) HackathonStack（ハッカソン用）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 11: Lambda 関数の環境変数
Lambda 関数に設定する環境変数を選択してください。

A) BEDROCK_MODEL_ID, BEDROCK_REGION, DYNAMODB_TABLE_NAME
B) BEDROCK_MODEL_ID, BEDROCK_REGION, DYNAMODB_TABLE_NAME, LOG_LEVEL
C) BEDROCK_MODEL_ID のみ（他はハードコード）
D) その他（[Answer]: タグの後に記述してください）

[Answer]: A

---

## 質問 12: API Gateway のカスタムドメイン
API Gateway にカスタムドメインを設定しますか？

A) 設定する（Route 53 + ACM 証明書）
B) 設定しない（デフォルトの API Gateway ドメインを使用）
C) その他（[Answer]: タグの後に記述してください）

[Answer]: B

---

## 質問 13: Amplify Hosting のカスタムドメイン
Amplify Hosting にカスタムドメインを設定しますか？

A) 設定する（Route 53 + ACM 証明書）
B) 設定しない（デフォルトの Amplify ドメインを使用）
C) その他（[Answer]: タグの後に記述してください）

[Answer]: B

---

## 質問 14: Lambda 関数のレイヤー
Lambda 関数で共通ライブラリをレイヤーとして分離しますか？

A) レイヤーを使用する（AWS SDK、共通ユーティリティ）
B) レイヤーを使用しない（各関数に含める）
C) その他（[Answer]: タグの後に記述してください）

[Answer]: B

---

## 質問 15: デプロイ環境の分離
開発環境と本番環境を分離しますか？

A) 分離する（dev スタックと prod スタック）
B) 分離しない（単一スタックのみ）
C) その他（[Answer]: タグの後に記述してください）

[Answer]: B

---

**質問作成日**: 2026-05-03
**バージョン**: 1.0
