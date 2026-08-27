# komapara 収益モデル 実装設計書（2026-08-27）

Stripe却下を受けた新収益モデルの実装設計。**投げ銭・Connect分配を捨て、プレミアム会員サブスク＋Spotify型配分の1本**に絞る。決済は **KOMOJU 直結**（Shopify・作品販売は不採用）。

---

## 1. 収益モデルの全体像

```
読者 ──(月額プレミアム会員費)──▶ KOMOJU(レジ) ──(週次入金)──▶ komaparaの口座
                                                                    │
                                              月末に按分            │
   クリエイター ◀──(銀行振込・業務委託報酬)── komapara ◀──────────┘
```

- **決済（レジ）= KOMOJU**。カード処理・継続課金・入金のみ。
- **中身（会員管理・閲覧集計・配分・振込）= komapara**。
- 「読者→作家への直接送金」は存在しない。必ずkomaparaを経由＝marketplace分配に当たらず審査を通せる。

**配分ロジック（Spotify型）**
```
配分原資     = 当月のプレミアム会員費の入金総額 × CREATOR_SHARE（初期案 50%）
各作家の取り分 = 配分原資 × (その作家の全作品の当月閲覧数 / 全作品の当月閲覧数合計)
```

---

## 2. データモデル

### 新規: ViewLog（月次集計用の閲覧ログ）
既存 `ReadHistory` は `@@unique([userId, workId])` で「1人×1作品=1行」しか持てず**月次集計に使えない**。配分の基礎として append 型のログを新設する。

```prisma
model ViewLog {
  id        String   @id @default(cuid())
  workId    String
  work      Work     @relation(fields: [workId], references: [id], onDelete: Cascade)
  userId    String?  // プレミアム会員のみ記録（配分対象）。ゲスト/無料会員は null
  isPremium Boolean  @default(false) // 集計時に会員閲覧だけ抽出できるように
  yearMonth String   // "2026-08"。集計キー
  viewedAt  DateTime @default(now())

  @@index([yearMonth, workId])
  @@index([workId])
}
```
- 記録箇所: 既存 `POST /api/works/[id]/view`（既に重複抑止 rate-limit 実装済み。30分1カウント）に ViewLog.append を足す。
- **配分対象は「プレミアム会員の閲覧」のみ**が公平（会員費が原資）。`isPremium` で抽出。

### 新規: CreatorEarning（月次のクリエイター報酬）
```prisma
model CreatorEarning {
  id         String   @id @default(cuid())
  creatorId  String
  creator    User     @relation("creatorEarnings", fields: [creatorId], references: [id])
  yearMonth  String   // "2026-08"
  viewCount  Int      // 当月の対象閲覧数（根拠）
  amount     Int      // 配分額（円）
  status     String   @default("pending") // pending / paid / carried（最低額未満で繰越）
  paidAt     DateTime?
  createdAt  DateTime @default(now())

  @@unique([creatorId, yearMonth])
  @@index([status])
}
```
- 最低支払額（初期案 1,000円）未満は `carried` で翌月繰越（振込手数料負け防止）。

### 変更: PremiumSubscription / SiteSetting
- `PremiumSubscription`: Stripe固有フィールド（stripeSubscriptionId 等）を KOMOJU の subscription id に読み替え。スキーマは汎用名なら流用可、Stripe専用名なら1カラム追加。
- `SiteSetting`: `creator_share`(配分率), `min_payout`(最低支払額) を追加して管理画面から変更可能に。

---

## 3. 決済フロー（KOMOJU 載せ替え）

既存 Stripe 実装（`api/stripe/checkout` の handlePremiumCheckout ＋ `api/webhooks/stripe`）を KOMOJU 版に置換。**構造は同じ（Checkout→Webhook→会員フラグ）**。

1. 読者が「プレミアム会員（月額）」を押す
2. `POST /api/komoju/checkout` → KOMOJU の Subscription セッション作成 → `session.url` を返す
3. 読者が KOMOJU の決済画面でカード入力 → 完了 → komapara に戻る
4. KOMOJU Webhook（`subscription.*` / `payment.captured`）→ `api/webhooks/komoju`
   - 署名検証（KOMOJUの署名方式に合わせる）
   - `PremiumSubscription` 作成/更新 ＋ `user.isPremium = true`
   - **冪等性ガード（既存 ProcessedWebhookEvent を流用）** で二重計上防止
5. 解約 Webhook → `isPremium = false`

**流用できる既存資産**: 会員状態(isPremium)による広告非表示、プレミアムバッジ、ProcessedWebhookEvent の冪等性ガード。**決済プロバイダー部分だけ差し替え**。

---

## 4. 月次配分バッチ

`POST /api/cron/monthly-payout`（Vercel Cron、毎月1日 JST に前月分を集計）

```
1. 前月 yearMonth を確定（Asia/Tokyo。toISOStringのUTCズレに注意）
2. 配分原資 = 前月のプレミアム会員費の入金総額 × creator_share
3. ViewLog(isPremium=true, 前月) を workId で集計 → 作家ごとに合算
4. 各作家 amount = floor(原資 × 作家閲覧数 / 全体閲覧数)
5. CreatorEarning を upsert（@@unique[creatorId,yearMonth] で二重実行を防ぐ）
6. min_payout 未満は status=carried（翌月に繰越加算）
```
- **初期は会員0＝原資0＝配分0**。会員が付くまで仕組みは動くが金額は出ない（正直に運用）。
- 振込自体は初期は手動（管理画面で確認 → 銀行振込 → paid マーク）。将来 KOMOJU/銀行APIで自動化検討。

---

## 5. 画面

### クリエイターダッシュボード（既存 /dashboard に追加）
- 今月の**推定収益**（今月の閲覧数 → 配分見込み。原資が確定するまで暫定表示）
- 過去の**確定収益・振込状況**（CreatorEarning 一覧）

### 管理画面（既存 /admin に追加）
- 月次配分の実行結果確認（作家別 amount）
- 振込マーク（status: pending → paid）
- creator_share / min_payout の設定

---

## 6. 実装タスクの順序

| # | タスク | 依存 |
|---|---|---|
| 1 | ViewLog モデル追加＋view APIで記録（会員閲覧を isPremium=true で） | なし。今すぐ着手可 |
| 2 | KOMOJU 決済連携（checkout / webhook）→ プレミアム会員登録 | KOMOJU審査通過 |
| 3 | 月次配分バッチ（CreatorEarning 計算） | 1 |
| 4 | クリエイターダッシュボード（収益表示） | 3 |
| 5 | 管理画面（配分確認・振込マーク・設定） | 3 |

**#1（ViewLog）は決済に依存しないので、KOMOJU審査を待たずに先行実装できる。** これを入れておけば、KOMOJU承認と同時に会員募集→配分が回り始める。

---

## 7. まだ埋まっていない一（要判断）

- **配分率 creator_share**: 初期案50%。残りはkomapara運営費（サーバー・KOMOJU手数料3.5%・運営）。要決定。
- **配分対象**: 「プレミアム会員の閲覧のみ」で設計（会員費が原資なので公平）。「全読者の閲覧」に広げる案もあるが、初期は会員閲覧に限定を推奨。
- **最低支払額 min_payout**: 初期案1,000円（振込手数料負け防止）。
- **KOMOJU料率の崖**: 「4コマのプレミアム会員（コンテンツ視聴）」が KOMOJU で物販扱い(3.5%)かデジタルコンテンツ扱い(9%/15%)か。**申請時に要確認**。収益設計に直結。
- **法務**: クリエイターへの支払いは業務委託報酬扱い。源泉徴収・インボイス・簡易な規約が要る（規模が小さいうちは軽いが、支払い開始前に整備）。
- **クリエイター登録要件**: 振込先口座の登録UI（設定ページに追加）。マイナンバー等の扱いは要検討。
