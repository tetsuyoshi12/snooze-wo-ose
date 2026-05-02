# コンポーネント定義

## フロントエンドコンポーネント

### 1. AlarmSettingPage
**目的**: アラーム時刻の設定と管理を行うページコンポーネント

**責務**:
- アラーム時刻の設定 UI を提供
- アラームの有効/無効切り替え
- スヌーズ間隔の設定
- デモモード起動ボタンの提供
- 設定内容の表示

**インターフェース**:
- Props: なし（ページコンポーネント）
- State: alarmTime, isEnabled, snoozeInterval, isDemoMode
- Context: AlarmContext（グローバル状態）

---

### 2. AlarmScreen
**目的**: アラーム鳴動時に表示される画面コンポーネント

**責務**:
- 墨絵風 UI の表示
- AI メッセージの表示
- 巨大スヌーズボタンと小さい起きるボタンの表示
- 雨音 BGM の再生（Nice-to-have）
- スヌーズ/起きるアクションの処理

**インターフェース**:
- Props: message（AI メッセージ）, onSnooze（スヌーズハンドラ）, onDismiss（起きるハンドラ）
- State: isPlaying（BGM 再生状態）
- Context: AlarmContext

---

### 3. RecordDashboard
**目的**: スヌーズ記録、堕落ゲージ、連続記録を表示するダッシュボード

**責務**:
- 堕落ゲージの視覚化
- 連続二度寝記録の表示
- 累計スヌーズ時間の表示
- 現在の称号の表示（Nice-to-have）
- 記録履歴の表示

**インターフェース**:
- Props: なし（ページコンポーネント）
- State: records（記録データ）
- Context: RecordContext

---

### 4. DemoScenario
**目的**: ハッカソン審査員向けのデモシナリオを実行するコンポーネント

**責務**:
- イントロ画面の表示
- デモシナリオの自動進行
- 事前に仕込まれたデモデータの表示
- 90 秒以内でのシナリオ完了

**インターフェース**:
- Props: なし
- State: currentStep（現在のステップ）, demoData（デモ用データ）
- Context: DemoContext

---

### 5. CertificateModal
**目的**: 30 日卒業証書を表示するモーダルコンポーネント

**責務**:
- 和紙風の卒業証書デザイン
- 達成日時の表示
- スクリーンショット用の UI
- モーダルの開閉制御

**インターフェース**:
- Props: isOpen（モーダル表示状態）, onClose（閉じるハンドラ）, achievementDate（達成日）
- State: なし
- Context: なし

---

### 6. MessageHistoryModal
**目的**: 過去の AI メッセージ履歴を表示するモーダル（Nice-to-have）

**責務**:
- メッセージ一覧の表示
- メッセージの検索/フィルタリング
- パターン種別ごとの分類
- 通し番号の表示

**インターフェース**:
- Props: isOpen, onClose
- State: messages（メッセージ履歴）, filter（フィルタ条件）
- Context: MessageContext

---

### 7. AlarmManager
**目的**: アラーム機能の中核ロジックを管理するサービスコンポーネント

**責務**:
- setTimeout/setInterval によるアラームスケジューリング
- Web Notifications API の制御
- アラーム鳴動時の処理
- スヌーズ処理
- デモモードの制御

**インターフェース**:
- Props: なし（サービスコンポーネント）
- Methods: setAlarm(), snooze(), dismiss(), triggerDemo()
- Context: AlarmContext

---

### 8. StorageManager
**目的**: ローカルストレージとの同期を管理するサービスコンポーネント

**責務**:
- ローカルストレージへの読み書き
- データの永続化
- オフライン対応
- データの同期（DynamoDB との連携）

**インターフェース**:
- Props: なし
- Methods: save(), load(), sync()
- Context: StorageContext

---

### 9. ErrorBoundary
**目的**: グローバルエラーハンドリングを行うコンポーネント

**責務**:
- React エラーのキャッチ
- エラー画面の表示
- エラーログの記録
- フォールバック UI の提供

**インターフェース**:
- Props: children（子コンポーネント）
- State: hasError, error
- Context: なし

---

### 10. AppLayout
**目的**: アプリケーション全体のレイアウトを提供するコンポーネント

**責務**:
- ヘッダー/フッターの表示
- ナビゲーション
- モーダル/タブの管理
- 墨絵風の背景デザイン

**インターフェース**:
- Props: children
- State: activeTab（現在のタブ）
- Context: LayoutContext

---

## バックエンドコンポーネント（Lambda 関数）

### 11. MessageGeneratorFunction
**目的**: AI メッセージを生成する Lambda 関数

**責務**:
- Amazon Bedrock API の呼び出し
- 5 つのパターンからランダム選択
- プロンプトの構築
- メッセージの生成（120 字以内）
- エラーハンドリングとフォールバック

**インターフェース**:
- Input: { pattern: string, context?: { date, weather } }
- Output: { message: string, pattern: string, messageId: string }
- Bedrock Model: Nova Lite / Claude Haiku / Claude Sonnet

---

### 12. RecordManagerFunction
**目的**: スヌーズ記録を管理する Lambda 関数

**責務**:
- DynamoDB への記録保存
- 記録の取得
- 堕落ゲージの計算
- 連続記録の更新
- 称号の判定（Nice-to-have）

**インターフェース**:
- Input: { action: 'save' | 'get', userId: string, record?: RecordData }
- Output: { success: boolean, data?: RecordData }
- DynamoDB Table: SnoozeRecords

---

### 13. AlarmConfigFunction
**目的**: アラーム設定を管理する Lambda 関数（将来的な拡張用）

**責務**:
- アラーム設定の保存
- アラーム設定の取得
- 複数アラームの管理（将来）

**インターフェース**:
- Input: { action: 'save' | 'get', userId: string, config?: AlarmConfig }
- Output: { success: boolean, data?: AlarmConfig }
- DynamoDB Table: AlarmConfigs

---

## 共通コンポーネント

### 14. Button
**目的**: 再利用可能なボタンコンポーネント

**責務**:
- 墨絵風のボタンデザイン
- サイズバリエーション（巨大、通常、小）
- クリックハンドリング
- ローディング状態の表示

**インターフェース**:
- Props: size, variant, onClick, disabled, loading, children

---

### 15. ProgressBar
**目的**: 堕落ゲージなどの進捗表示コンポーネント

**責務**:
- 進捗バーの視覚化
- アニメーション
- ラベル表示

**インターフェース**:
- Props: value, max, label, color

---

### 16. Modal
**目的**: 汎用モーダルコンポーネント

**責務**:
- モーダルの表示/非表示
- オーバーレイ
- 閉じるボタン
- アクセシビリティ対応

**インターフェース**:
- Props: isOpen, onClose, title, children

---

## コンポーネント総数
- **フロントエンドページ**: 4 個（AlarmSettingPage、AlarmScreen、RecordDashboard、DemoScenario）
- **フロントエンドモーダル**: 2 個（CertificateModal、MessageHistoryModal）
- **サービスコンポーネント**: 4 個（AlarmManager、StorageManager、ErrorBoundary、AppLayout）
- **バックエンド Lambda**: 3 個（MessageGeneratorFunction、RecordManagerFunction、AlarmConfigFunction）
- **共通コンポーネント**: 3 個（Button、ProgressBar、Modal）

**合計**: 16 個のコンポーネント

---

**作成日**: 2026-05-02
**バージョン**: 1.0
