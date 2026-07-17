# Instagram 公式連携（Instagram API with Instagram Login）セットアップ

> 目的：匿名スクレイピング（IGが定期的に封鎖）をやめ、**作家が自分のIGを1回連携するだけで、
> 自分の投稿をカルーセル・原寸で正確に取り込める**堅い仕組みに置き換える。

---

## 0. 重要：クローズドβは App Review を待たずに使える

- 開発モードのアプリでも、**「Instagramテスター」に追加したアカウント**は連携・メディア取得が可能。
- つまり **招待作家をテスターに登録すれば、審査完了前でもIG連携をそのまま使える**（〜約25人まで）。
- **App Review（2〜4週）は「一般公開」で不特定多数の作家に開放するとき**に必要。→ 招待運用と並行して申請を進めればよい。

---

## 1. 前提（作家側・無料）

- 連携する作家のIGが **プロアカウント（ビジネス or クリエイター）** であること。
  - IGアプリ → 設定 → アカウントの種類 → 「プロアカウントに切り替える」（1タップ・無料）。
  - 本気で発信している4コマ作家はほぼ該当 or すぐ切替可。

## 2. Meta（Facebook）アプリの作成 ← 西川さんの操作（約30分）

1. https://developers.facebook.com/apps/ → **「アプリを作成」**
2. ユースケース：**「Instagram」→ Instagram APIを使用（Instagram Login）** を選択
3. アプリ名（例：`komapara`）を作成
4. 左メニュー **「Instagram」→「API setup with Instagram login」** を開く
5. **「3. Set up Instagram business login」** で以下を設定：
   - **OAuth redirect URI**：`https://komapara.com/api/instagram/callback`
   - **Deauthorize / Data deletion callback**（任意・後で可）
6. 上部に表示される **Instagram App ID** と **Instagram App Secret** を控える（← 私に共有）
7. **「4. Add account」**（Instagramテスター）で、招待する作家のIGユーザー名を追加
   → 作家側のIGアプリで「設定 → Apps and websites → Tester invites」から承認

### 必要スコープ
- `instagram_business_basic`（プロフィール＋メディアの読み取り。GET /me/media に必要）

### 私に共有してほしいもの
- `Instagram App ID`
- `Instagram App Secret`
（これらを Vercel env に `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` として設定して実装を有効化する）

---

## 3. komapara 側の実装計画（私が担当）

App ID/Secret をもらい次第、以下を実装（OAuthは実クレデンシャルが無いとテストできないため、この順）：

**DB**
- `InstagramAccount` モデル追加：`userId`（作家）/ `igUserId` / `username` / `accessToken`（長期・60日）/ `tokenExpiry`

**OAuth（Instagram Login）**
- `GET /api/instagram/connect` → Instagram認可画面へリダイレクト（scope=`instagram_business_basic`）
- `GET /api/instagram/callback` → code を短期トークン→**長期トークン(60日)** に交換し保存。期限前に自動更新

**メディア取得・取り込み**
- `GET /api/instagram/media` → `graph.instagram.com/me/media?fields=id,caption,media_type,media_url,children{media_url}`
  で本人の投稿一覧（カルーセルは children 展開）を返す
- 作家が投稿を選ぶ → 画像（media_url ＋ carousel children）を取得 → WebP変換 → Blob保存 → 作品作成
  - **カルーセル＝全コマ、原寸で正確**（クロップ問題も解消）

**UI**
- 投稿フローの方式選択に **「Instagramアカウント連携」** を追加
  - 未連携：「Instagramを連携」ボタン
  - 連携済：直近投稿をグリッド表示 → 選んで取り込み（URL貼り付け不要）
- 既存の「URL貼り付け」方式は、公式連携が動いたら段階的に置換

**繋ぎ（審査/連携前）**
- 「直接アップロード」を導線として維持（既に方式選択に存在）。Xにも上げている作家は **X連携**で解消。

---

## 4. App Review 申請（一般公開時に提出）

> 状態: **実装は完了。あとは西川さんがMetaのダッシュボードで設定＋提出するだけ。**
> （Metaのダッシュボード操作と録画は、私からは実行できません）

### 4-1. 先にMetaダッシュボードへ登録する3つのURL

アプリ設定 → Instagram → 「Webhookとコールバック」欄に貼る:

| 項目 | 値 |
|---|---|
| Deauthorize callback URL | `https://komapara.com/api/instagram/deauthorize` |
| Data deletion request URL | `https://komapara.com/api/instagram/data-deletion` |
| プライバシーポリシーURL | `https://komapara.com/privacy` |

いずれも実装済み・稼働中（`signed_request` の署名検証あり）。

### 4-2. 申請スコープ

`instagram_business_basic` のみ。（投稿・削除・インサイトは要求しない）

### 4-3. ユースケース説明（そのまま貼れる）

**English:**
> Komapara (komapara.com) is a portal for 4-panel manga (yonkoma). Creators who already
> publish their comics on Instagram connect their own Instagram professional account so
> that they can import **their own posts** into Komapara instead of re-uploading the same
> artwork by hand.
>
> We use `instagram_business_basic` solely to read the connected user's own profile and
> their own media list (`GET /me/media`, including `children` for carousels). The images are
> copied into the creator's own Komapara post, which the creator explicitly selects and
> publishes. We never access data belonging to any third party, and we do not post,
> modify, or delete anything on Instagram.

**日本語:**
> コマパラは4コマ漫画のポータルです。すでにInstagramで4コマを公開している作家が、自身の
> プロアカウントを連携し、**自分自身の投稿**をコマパラに取り込めるようにするための機能です
> （同じ作品を手作業で再アップロードする手間を無くすため）。
> `instagram_business_basic` は、連携した本人のプロフィールと本人のメディア一覧
> （`GET /me/media`／カルーセルは `children`）の読み取りにのみ使用します。取り込む投稿は
> 作家自身が選択し、作家自身の作品として公開します。第三者のデータは一切取得せず、
> Instagram側への投稿・変更・削除も行いません。

### 4-4. スクリーンキャスト台本（審査で必須・西川さんが録画）

アオンのアカウントで、以下を**1本撮り**で録画（音声不要・字幕推奨）:

1. `komapara.com` にログイン済みの状態を映す
2. 「+ 投稿」→「Instagramから取り込み」を押す
3. **Instagramの認可画面**が出て、要求スコープが表示されるところを映す（審査で最重要）
4. 「許可」を押す
5. 自分の投稿一覧がグリッド表示される
6. 4コマ投稿を1つ選び「取り込む」
7. タイトルを入れて公開 → 作品ページに4コマ全部が表示される
8. （あれば）`/settings` から連携解除できることも映す

※ 3番の認可画面が映っていないと差し戻されます。

### 4-5. テスト用アカウント

審査担当者用に、Metaの申請フォームで以下を伝える:
- コマパラはGoogle/Xログインのため、審査担当者用のテストアカウントを1つ用意して
  ID/パスワードを記載するか、レビュー用のログイン手順を明記する
- Instagram側はテスターに追加した検証用アカウントを案内

## まとめ：進め方

| ステップ | 担当 | 所要 |
|---|---|---|
| Metaアプリ作成・Instagram Login設定・テスター追加 | 西川さん | 〜30分 |
| App ID/Secret を共有 | 西川さん | 即 |
| DB＋OAuth＋メディア取得＋UI 実装 | 私 | クレデンシャル受領後 |
| クローズドβで実運用（テスター経由） | — | 審査不要 |
| App Review 申請（一般公開向け） | 西川さん＋私（ドラフト提供） | 並行・2〜4週 |
