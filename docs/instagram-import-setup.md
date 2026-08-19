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

---

## 5. App Review instructions（レビュアー向け手順・そのまま貼る）

> 2026-08-06 ビジネス認証が通過。App Review提出時に「App Review instructions」欄へ貼る。
> レビュアーはGoogleログインでkomaparaに入れるため、専用テストアカウントは不要。

**English (paste into "App Review instructions"):**
> Komapara (https://komapara.com) is a portal for 4-panel manga. This app uses
> `instagram_business_basic` so that a creator can import **their own** Instagram posts
> into their own Komapara account, instead of re-uploading the same artwork by hand.
>
> How to test:
> 1. Open https://komapara.com and click "ログイン" (Login). You can sign in with your
>    own Google account — no dedicated test account is required to access the site.
> 2. Click "+ 投稿" (Post) → "Instagramから取り込み" (Import from Instagram).
> 3. You will be sent to the Instagram authorization screen, which shows the requested
>    `instagram_business_basic` scope. Approve it.
> 4. Your own Instagram media grid appears. Select one post and import it.
> 5. Add a title and publish — the post appears as the creator's own Komapara work.
>
> The full flow, including the Instagram authorization screen, is shown in the attached
> screencast. Because the app is still in development mode, live connection requires the
> reviewer's Instagram account to be added as a Tester — if you need to run the flow on
> your own account, please let us know the Instagram handle and we will add it immediately.
>
> We only read the connected user's own profile and own media list. We never access any
> third party's data, and we never post, modify, or delete anything on Instagram.

**補足（西川さん向けメモ）:**
- テストアカウントの ID/パスワード欄は空でよい（Googleログインのため手順で代替）
- もしフォームがテストアカウント必須なら、レビュー用のGoogleアカウントを1つ作って
  komaparaにログイン→そのメール/手順を記載する（本番ユーザーには影響しない）

---

## 6. 提出記録（2026-08-06）

**App Review を提出。ステータス = 審査中（20日以内）。**

提出内容:
- 権限: `instagram_business_basic` の **1件のみ**（manage_comments / manage_messages /
  content_publish は全て外した。content_publish はプライバシーポリシーと矛盾）
- 用途説明（英）＋ レビュアー向けテスト手順（§4-3 / §5）
- スクリーンキャスト: `docs/app-review-screencast.mp4`（82MB・git除外）
- データの取り扱い: 処理事業者 = TSURATSURA,K.K.(日本) / Vercel Inc.(米) / Neon,Inc.(米)、
  責任主体 = TSURATSURA,K.K.、国家安全保障の当局提出 = **いいえ**（初期値が誤って「はい」だった）
- Facebookログイン統合 = **いいえ**（komaparaはGoogle/Xログインのみ）
- プラットフォーム = Website(komapara.com)、アイコン・プライバシーポリシー設定済み

前提（済）:
- ビジネス認証 TSURATSURA,K.K. = 2026/08/06 認証済み
- Tech Provider認証（Access verification）は **押さない**＝他社アセット用で不要

審査中の注意:
1. 審査完了までアプリ設定を触らない（変更は審査に影響）
2. レビュアーが実機テストできず差し戻された場合 → Metaが「Instagramハンドルを教えて」と
   言ってくる → アプリの「役割 → テスター(Instagram)」にそのIGアカウントを追加
3. 差し戻し(revision)は普通に起きる。理由を読んで直して再提出
4. 通過まで一般公開でIG連携は使えない。それまではXインポート・画像アップロードで運用

App ID: Instagram=1601669075007295 / Meta App=1004626322572734

---

## 7. 却下→再提出（2026-08-19 却下）

**却下理由:** 「スクリーンキャストがユースケースの詳細に整合しない」(開発者ポリシー1条6項)。
**ユースケース(用途)自体は承認可と判断された。動画だけが理由。**

Metaが再提出動画に求める要素:
1. 完全なInstagramログイン〜認可フロー（ログイン入力から映す）
2. ユーザーが権限を付与する瞬間（認可画面で「許可」）
3. 取り込み〜公開までのエンドツーエンド
4. **英語で説明**（UIが日本語なので字幕で各ボタン・各ステップの意味を英語で）
5. サーバー間アプリではない（フロントのログインフローあり）＝該当せず

### 再撮影の台本（各シーンに英語字幕を焼き込む）

★前回の最大の穴 = Instagramにログイン済みで撮ったため「ログイン入力画面」が映らなかった。
　今回は【Instagramから一度ログアウトしてから】撮る。ログイン入力→認可→許可を必ず映す。

| # | 操作 | 焼き込む英語字幕 |
|---|---|---|
| 0 | タイトルカード | Komapara (komapara.com) — importing my own Instagram posts. Requested permission: instagram_business_basic |
| 1 | komapara.comにログイン済みを映す | This is Komapara, a portal for 4-panel manga. I am a creator, logged into my own account. |
| 2 | 「+ 投稿」を押す | Clicking the "Post" button (+ 投稿) to create a new work. |
| 3 | 「Instagramから取り込み」を押す | Choosing "Import from Instagram" (Instagramから取り込み). |
| 4 | Instagramのログイン画面でID/PW入力 | This is Instagram's own login screen. I sign in with my own Instagram professional account. |
| 5 | 認可画面（スコープ表示）を3秒以上映す | This is the Instagram authorization screen. It shows the requested permission: instagram_business_basic — read access to my own profile and my own media. |
| 6 | 「許可」を押す | I tap "Allow" to grant access. |
| 7 | 本人のメディアがグリッド表示 | My own Instagram posts are now displayed inside Komapara. |
| 8 | 4コマ投稿を1つ選ぶ | I select one of my own 4-panel comics to import. |
| 9 | 取り込み＋タイトル入力 | The images are imported into a new Komapara post. I add a title. |
| 10 | 公開→作品ページに4コマ表示 | I publish it. It now appears as my own work on Komapara, showing all four panels. |
| 11 | (任意)設定→連携解除を映す | I can disconnect the Instagram connection anytime from the settings page. |

撮影の必須ルール:
- 【最重要】先にInstagramからログアウト → #4のログイン入力を必ず映す（前回の穴）
- 認可画面(#5)は3秒以上静止して映す（審査で最重要）
- パスワード入力はマスト表示(●●●)でよい。実際の文字は映さなくてよい
- 全編に上表の英語字幕を焼き込む。Windows標準の Clipchamp で字幕追加可
- UIのボタンは日本語のままでよいが、字幕で意味を英語で添える
- 音声は不要

再提出手順: App Review → 却下された申請 → 新しいスクリーンキャストで再申請。
用途説明・データ取扱い等は前回のまま流用できる(承認済みのため)。動画を差し替えるのが主。

### 再提出（2026-08-19）— 却下理由をピンポイント修正

**動画を英語字幕入り・完全フローに差し替えて再提出。ステータス=審査中(20日以内)。**

前回の却下理由「スクリーンキャストがユースケースに整合しない」に対応:
- 新スクリーンキャスト docs/app-review-screencast.mp4（9MB・字幕焼き込み済み）
  ・元動画: Videos/Captures の録画（Instagramログアウト状態から撮影）
  ・ffmpeg で英語字幕(subs.srt)を焼き込み。各シーンにタイミング合わせ済み
  ・映っている全フロー: Instagramログイン→認可画面(instagram_business_basic明示・3秒以上)
    →許可→本人メディア一覧→4コマ選択→取込→タイトル→公開→作品ページに4コマ表示
- Metaの4要件を充足: (1)完全なログインフロー (2)権限付与の瞬間 (3)エンドツーエンド (4)英語説明
- 用途説明・データ取扱い(国家安全保障=いいえ)・審査手順・FBログイン=いいえ は前回のまま維持

★動画の字幕付けは ffmpeg で自動化できる:
  ffmpeg -i 録画.mp4 -vf "subtitles='C\:/.../subs.srt':force_style='FontName=Arial,Fontsize=11,
  Alignment=2,MarginV=25,MarginL=50,MarginR=50,Outline=2'" -c:v libx264 -crf 22 -c:a copy out.mp4
  （Windowsのパスはコロンを \: にエスケープ。字幕内容はシーンのタイムスタンプに合わせる）
