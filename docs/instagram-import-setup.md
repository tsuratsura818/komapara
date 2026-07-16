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

## 4. App Review 申請ドラフト（一般公開時に提出）

**申請スコープ：** `instagram_business_basic`

**ユースケース説明（提出用・英/日）：**
> コマパラ（komapara.com）は4コマ漫画に特化した投稿ポータルです。クリエイターが自身のInstagram
> プロアカウントを連携すると、**本人の投稿（画像・カルーセル）をコマパラ上に取り込んで公開**できます。
> 二重投稿の手間を無くし、既存のInstagram作品を流用できるようにするための機能です。
> `instagram_business_basic` は、連携した本人のプロフィールとメディア一覧（GET /me/media）の読み取りに
> のみ使用します。第三者のデータは取得しません。

**スクリーンキャスト台本（審査で必須）：**
1. komaparaにログイン → 投稿 → 「Instagramを連携」
2. Instagramの認可画面で許可
3. 自分の投稿一覧が表示される
4. 4コマ投稿を1つ選び「取り込む」
5. コマパラ上に作品として公開される（カルーセル全コマ表示）

**プライバシーポリシー / データ削除：** `https://komapara.com/privacy`（Deauthorize/Deletion コールバックも実装）

---

## まとめ：進め方

| ステップ | 担当 | 所要 |
|---|---|---|
| Metaアプリ作成・Instagram Login設定・テスター追加 | 西川さん | 〜30分 |
| App ID/Secret を共有 | 西川さん | 即 |
| DB＋OAuth＋メディア取得＋UI 実装 | 私 | クレデンシャル受領後 |
| クローズドβで実運用（テスター経由） | — | 審査不要 |
| App Review 申請（一般公開向け） | 西川さん＋私（ドラフト提供） | 並行・2〜4週 |
