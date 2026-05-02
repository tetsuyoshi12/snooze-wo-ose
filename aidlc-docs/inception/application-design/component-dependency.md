# コンポーネント依存関係と通信パターン

このドキュメントでは、コンポーネント間の依存関係、通信パターン、データフローを定義します。

---

## 1. 依存関係マトリックス

### フロントエンドコンポーネント依存関係

| コンポーネント | 依存先 | 依存理由 |
|---|---|---|
| AlarmSettingPage | AlarmManager | アラーム設定の保存 |
| AlarmSettingPage | StorageManager | 設定の永続化 |
| AlarmSettingPage | DemoScenario | デモモード起動 |
| AlarmScreen | AlarmManager | スヌーズ/停止処理 |
| AlarmScreen | MessageGeneratorFunction | AI メッセージ取得 |
| AlarmScreen | RecordManagerFunction | 記録保存 |
| RecordDashboard | RecordManagerFunction | 記録取得 |
| RecordDashboard | StorageManager | ローカル記録取得 |
| RecordDashboard | CertificateModal | 卒業証書表示 |
| DemoScenario | AlarmManager | デモアラーム起動 |
| DemoScenario | StorageManager | デモデータ読み込み |
| CertificateModal | なし | 独立コンポーネント |
| MessageHistoryModal | StorageManager | メッセージ履歴取得 |
| MessageHistoryModal | RecordManagerFunction | クラウド履歴取得 |
| AlarmManager | StorageManager | 設定読み込み |
| AlarmManager | MessageGeneratorFunction | メッセージ生成 |
| AlarmManager | RecordManagerFunction | 記録保存 |
| StorageManager | RecordManagerFunction | クラウド同期 |
| StorageManager | AlarmConfigFunction | 設定同期 |
| ErrorBoundary | なし | 独立コンポーネント |
| AppLayout | AlarmSettingPage | ページ表示 |
| AppLayout | AlarmScreen | ページ表示 |
| AppLayout | RecordDashboard | ページ表示 |
| AppLayout | CertificateModal | モーダル表示 |
| AppLayout | MessageHistoryModal | モーダル表示 |

---

### バックエンドコンポーネント依存関係

| コンポーネント | 依存先 | 依存理由 |
|---|---|---|
| MessageGeneratorFunction | Amazon Bedrock | AI メッセージ生成 |
| MessageGeneratorFunction | CloudWatch Logs | ログ記録 |
| RecordManagerFunction | DynamoDB (SnoozeRecords) | 記録保存/取得 |
| RecordManagerFunction | CloudWatch Logs | ログ記録 |
| AlarmConfigFunction | DynamoDB (AlarmConfigs) | 設定保存/取得 |
| AlarmConfigFunction | CloudWatch Logs | ログ記録 |

---

## 2. 通信パターン

### 2.1 フロントエンド内部通信

#### Context API による状態共有
```
AlarmContext
  ├─ Provider: AppLayout
  └─ Consumer: AlarmSettingPage, AlarmScreen, AlarmManager

RecordContext
  ├─ Provider: AppLayout
  └─ Consumer: RecordDashboard, AlarmScreen

DemoContext
  ├─ Provider: AppLayout
  └─ Consumer: DemoScenario, AlarmSettingPage

StorageContext
  ├─ Provider: AppLayout
  └─ Consumer: StorageManager, AlarmManager, RecordDashboard
```

#### Props による親子通信
```
AppLayout
  ├─> AlarmSettingPage (props: なし)
  ├─> AlarmScreen (props: message, onSnooze, onDismiss)
  ├─> RecordDashboard (props: なし)
  ├─> CertificateModal (props: isOpen, onClose, achievementDate)
  └─> MessageHistoryModal (props: isOpen, onClose)
```

---

### 2.2 フロントエンド → バックエンド通信

#### API Gateway 経由の REST API 呼び出し

**MessageGeneratorFunction 呼び出し**:
```
AlarmScreen
  └─> fetch('/api/message/generate')
      └─> API Gateway
          └─> MessageGeneratorFunction
              └─> Amazon Bedrock
```

**リクエスト**:
```json
POST /api/message/generate
{
  "pattern": "poetic",
  "context": {
    "date": "2026-05-03",
    "weather": "rainy"
  }
}
```

**レスポンス**:
```json
{
  "message": "雨音に誘われて、もう少しだけ夢の中へ...",
  "pattern": "poetic",
  "messageId": "msg_20260503_001"
}
```

---

**RecordManagerFunction 呼び出し（保存）**:
```
AlarmScreen
  └─> fetch('/api/record/save')
      └─> API Gateway
          └─> RecordManagerFunction
              └─> DynamoDB (SnoozeRecords)
```

**リクエスト**:
```json
POST /api/record/save
{
  "userId": "user_local_001",
  "action": "snooze",
  "messageId": "msg_20260503_001",
  "pattern": "poetic",
  "timestamp": "2026-05-03T07:00:00Z"
}
```

**レスポンス**:
```json
{
  "success": true,
  "consecutiveDays": 5,
  "gauge": 42
}
```

---

**RecordManagerFunction 呼び出し（取得）**:
```
RecordDashboard
  └─> fetch('/api/record/get?userId=user_local_001')
      └─> API Gateway
          └─> RecordManagerFunction
              └─> DynamoDB (SnoozeRecords)
```

**リクエスト**:
```
GET /api/record/get?userId=user_local_001
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "timestamp": "2026-05-03T07:00:00Z",
        "action": "snooze",
        "messageId": "msg_20260503_001",
        "pattern": "poetic"
      }
    ],
    "gauge": 42,
    "consecutiveDays": 5,
    "totalSnoozeTime": 150
  }
}
```

---

### 2.3 ローカルストレージ通信

#### StorageManager によるデータ永続化

**保存**:
```
AlarmManager
  └─> StorageManager.save('alarmConfig', config)
      └─> localStorage.setItem('alarmConfig', JSON.stringify(config))
```

**読み込み**:
```
AlarmManager
  └─> StorageManager.load('alarmConfig')
      └─> localStorage.getItem('alarmConfig')
          └─> JSON.parse(data)
```

**同期**:
```
StorageManager.sync()
  ├─> localStorage.getItem('records')
  ├─> fetch('/api/record/get')
  ├─> マージ処理
  └─> localStorage.setItem('records', merged)
```

---

## 3. データフロー図

### 3.1 アラーム設定フロー

```
ユーザー
  └─> AlarmSettingPage
      ├─> AlarmManager.setAlarm(time)
      │   ├─> setTimeout(triggerAlarm, delay)
      │   └─> StorageManager.save('alarmConfig', config)
      │       └─> localStorage
      └─> Context 更新
```

---

### 3.2 アラーム鳴動フロー

```
setTimeout 満了
  └─> AlarmManager.triggerAlarm()
      ├─> Web Notifications API
      │   └─> 通知表示
      ├─> fetch('/api/message/generate')
      │   └─> MessageGeneratorFunction
      │       └─> Amazon Bedrock
      │           └─> AI メッセージ生成
      └─> AlarmScreen 表示
          └─> message を props で渡す
```

---

### 3.3 スヌーズフロー

```
ユーザー（スヌーズボタン押下）
  └─> AlarmScreen.handleSnooze()
      ├─> AlarmManager.snooze(interval)
      │   ├─> setTimeout(triggerAlarm, interval)
      │   └─> fetch('/api/record/save')
      │       └─> RecordManagerFunction
      │           └─> DynamoDB (SnoozeRecords)
      ├─> StorageManager.save('records', record)
      │   └─> localStorage
      └─> AlarmScreen を閉じる
```

---

### 3.4 記録表示フロー

```
ユーザー（記録タブ選択）
  └─> RecordDashboard
      ├─> StorageManager.load('records')
      │   └─> localStorage
      ├─> fetch('/api/record/get')
      │   └─> RecordManagerFunction
      │       └─> DynamoDB (SnoozeRecords)
      ├─> マージ処理
      ├─> calculateGauge()
      ├─> getConsecutiveDays()
      └─> 表示更新
```

---

### 3.5 卒業証書表示フロー

```
RecordDashboard
  └─> getConsecutiveDays() === 30
      └─> CertificateModal.open()
          └─> モーダル表示
              ├─> 和紙風デザイン
              ├─> 達成日時
              └─> スクリーンショット可能
```

---

### 3.6 デモモードフロー

```
ユーザー（デモボタン押下）
  └─> AlarmSettingPage.startDemoMode()
      └─> DemoScenario
          ├─> loadDemoData()
          │   └─> StorageManager.load('demoData')
          ├─> イントロ画面表示
          ├─> autoProgress()
          │   ├─> AlarmManager.triggerDemo()
          │   │   └─> AlarmScreen 表示（デモメッセージ）
          │   ├─> スヌーズ自動実行
          │   └─> RecordDashboard 表示（デモ記録）
          └─> 90 秒で完了
```

---

## 4. コンポーネント間の結合度

### 4.1 疎結合（推奨）
- **AlarmScreen ↔ MessageGeneratorFunction**: API 経由、インターフェース定義
- **RecordDashboard ↔ RecordManagerFunction**: API 経由、インターフェース定義
- **StorageManager ↔ Lambda Functions**: API 経由、非同期

### 4.2 中結合
- **AlarmManager ↔ StorageManager**: 直接呼び出し、インターフェース定義
- **AlarmScreen ↔ AlarmManager**: 直接呼び出し、メソッド依存

### 4.3 密結合（避けるべき）
- なし（設計上、密結合は避けている）

---

## 5. エラー伝播パターン

### 5.1 フロントエンドエラー伝播

```
AlarmScreen.handleSnooze()
  └─> try-catch
      ├─> AlarmManager.snooze()
      │   └─> try-catch
      │       ├─> fetch('/api/record/save')
      │       │   └─> ネットワークエラー
      │       └─> catch: ローカル保存のみ
      └─> catch: ErrorBoundary にバブルアップ
```

### 5.2 バックエンドエラー伝播

```
MessageGeneratorFunction.handler()
  └─> try-catch
      ├─> generateMessage()
      │   └─> try-catch
      │       ├─> callBedrock()
      │       │   └─> Bedrock API エラー
      │       └─> catch: フォールバックメッセージ
      └─> catch: エラーレスポンス返却
```

---

## 6. 非同期処理パターン

### 6.1 Promise チェーン

```javascript
AlarmManager.triggerAlarm()
  .then(() => MessageService.generateMessage())
  .then((message) => AlarmScreen.show(message))
  .catch((error) => ErrorService.handle(error));
```

### 6.2 Async/Await

```javascript
async handleSnooze() {
  try {
    await AlarmManager.snooze(interval);
    await RecordService.save(record);
    this.close();
  } catch (error) {
    ErrorService.handle(error);
  }
}
```

---

## 7. イベント駆動パターン

### 7.1 カスタムイベント

```javascript
// AlarmManager がイベントを発火
window.dispatchEvent(new CustomEvent('alarmTriggered', {
  detail: { time: new Date() }
}));

// AlarmScreen がイベントをリッスン
window.addEventListener('alarmTriggered', (event) => {
  this.show(event.detail.time);
});
```

### 7.2 Context API による状態変更通知

```javascript
// AlarmContext で状態を更新
const [alarmState, setAlarmState] = useState(initialState);

// 複数のコンポーネントが自動的に再レンダリング
<AlarmContext.Provider value={{ alarmState, setAlarmState }}>
  <AlarmSettingPage />
  <AlarmScreen />
</AlarmContext.Provider>
```

---

## 8. データ同期パターン

### 8.1 楽観的更新

```javascript
// ローカルストレージに即座に保存
StorageManager.save('records', newRecord);

// バックグラウンドでクラウドに同期
RecordManagerFunction.save(newRecord)
  .catch((error) => {
    // 同期失敗時はローカルに保持
    console.error('Sync failed, will retry later', error);
  });
```

### 8.2 定期同期

```javascript
// 5 分ごとに同期
setInterval(() => {
  StorageManager.sync();
}, 5 * 60 * 1000);
```

### 8.3 オンライン復帰時の同期

```javascript
window.addEventListener('online', () => {
  StorageManager.sync();
});
```

---

## 9. キャッシュ戦略

### 9.1 メッセージキャッシュ

```javascript
// メッセージを localStorage にキャッシュ
const cachedMessage = StorageManager.load('lastMessage');
if (cachedMessage && Date.now() - cachedMessage.timestamp < 60000) {
  return cachedMessage.data;
}

// キャッシュがない場合は API 呼び出し
const message = await MessageService.generateMessage();
StorageManager.save('lastMessage', {
  data: message,
  timestamp: Date.now()
});
```

### 9.2 記録キャッシュ

```javascript
// 記録をローカルストレージにキャッシュ
const cachedRecords = StorageManager.load('records');
if (cachedRecords) {
  // キャッシュを表示
  this.setState({ records: cachedRecords });
}

// バックグラウンドでクラウドから取得
RecordService.getRecords()
  .then((cloudRecords) => {
    // マージして更新
    const merged = this.mergeRecords(cachedRecords, cloudRecords);
    this.setState({ records: merged });
    StorageManager.save('records', merged);
  });
```

---

## 10. 依存関係の可視化

### 10.1 レイヤー構造

```
+---------------------------------------------------+
|                  Presentation Layer               |
|  (AlarmSettingPage, AlarmScreen, RecordDashboard) |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|                   Service Layer                   |
|  (AlarmManager, StorageManager, MessageService)   |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|                    API Layer                      |
|         (API Gateway, Lambda Functions)           |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|                   Data Layer                      |
|      (DynamoDB, localStorage, Amazon Bedrock)     |
+---------------------------------------------------+
```

### 10.2 依存関係の方向

```
上位レイヤー → 下位レイヤー（依存）
下位レイヤー → 上位レイヤー（依存しない）

例:
AlarmScreen → AlarmManager (OK)
AlarmManager → AlarmScreen (NG)
```

---

## 11. 循環依存の回避

### 11.1 循環依存の例（避けるべき）

```
AlarmManager → MessageService
MessageService → AlarmManager (循環依存)
```

### 11.2 解決策: インターフェース分離

```
AlarmManager → MessageServiceInterface
MessageService → MessageServiceInterface を実装
```

---

## 12. テスト容易性のための依存性注入

### 12.1 依存性注入パターン

```javascript
class AlarmManager {
  constructor(storageManager, messageService) {
    this.storageManager = storageManager;
    this.messageService = messageService;
  }

  async triggerAlarm() {
    const message = await this.messageService.generateMessage();
    // ...
  }
}

// テスト時はモックを注入
const mockStorage = new MockStorageManager();
const mockMessage = new MockMessageService();
const alarmManager = new AlarmManager(mockStorage, mockMessage);
```

---

**作成日**: 2026-05-03
**バージョン**: 1.0
