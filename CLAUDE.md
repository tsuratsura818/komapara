# CLAUDE.md — コマパラ（Komapara）開発指示書

> このファイルはClaude Codeが読み込む開発指示書です。
> プロジェクトのコンテキスト・技術スタック・実装方針・優先順位をすべてここに集約しています。

---

## 📌 プロジェクト概要

**サービス名:** コマパラ（Komapara）
**コンセプト:** 4コマ漫画に特化した読者向けポータルサイト
**MVP目標:** 読者が4コマ漫画を快適に読める場所を作る。クリエイターが作品を投稿でき、広告収益でマネタイズする。

### ターゲットユーザー
- **読者（優先）:** 20〜40代・スマホユーザー・通勤通学のスキマ時間に手軽なコンテンツを楽しみたい人
- **クリエイター（二次）:** XやInstagramで4コマを投稿している個人作家

### ビジネスモデル（フェーズ別）
- **Phase 1:** Google AdSense による広告収益
- **Phase 2:** 投げ銭（手数料10%）・クリエイターサブスク（手数料15%）・広告非表示プレミアム（月額300円）
- **Phase 3:** AIネタ出し機能・グッズEC連携

---

## 🏗️ 技術スタック

### フロントエンド
```
- フレームワーク: Next.js 14（App Router）
- 言語: TypeScript
- スタイリング: Tailwind CSS
- UI コンポーネント: shadcn/ui
- 状態管理: Zustand
- フォーム: React Hook Form + Zod
- 画像最適化: Next.js Image（next/image）
```

### バックエンド
```
- フレームワーク: Next.js API Routes（同一リポジトリ）
- ORM: Prisma
- 認証: NextAuth.js（v5）
  - プロバイダー: Google OAuth / X（Twitter）OAuth / Email（Magic Link）
- ファイルアップロード: Uploadthing または AWS S3（環境変数で切り替え）
```

### データベース
```
- 本番: PostgreSQL（Supabase 推奨）
- ローカル開発: PostgreSQL（Docker Compose）
- キャッシュ: Redis（Upstash）
```

### インフラ（推奨）
```
- ホスティング: Vercel
- DB: Supabase
- 画像ストレージ: Cloudflare R2 または AWS S3
- CDN: Cloudflare
```

### 開発ツール
```
- パッケージマネージャー: pnpm
- Linter: ESLint + Prettier
- Git フック: Husky + lint-staged
- テスト: Vitest（Unit）+ Playwright（E2E）
```

---

## 📁 ディレクトリ構成

```
komapara/
├── CLAUDE.md                    # ← このファイル
├── docs/
│   ├── spec.md                  # 機能仕様書
│   ├── db-schema.md             # DBスキーマ定義
│   ├── api-spec.md              # API仕様書
│   └── design-guidelines.md    # UIデザイン指針
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (public)/            # 認証不要ルート
│   │   │   ├── page.tsx         # ホーム（フィード）
│   │   │   ├── ranking/         # 週間ランキング
│   │   │   ├── genre/[slug]/    # ジャンル別一覧
│   │   │   ├── work/[id]/       # 作品詳細ページ
│   │   │   └── creator/[id]/    # 作家ページ
│   │   ├── (auth)/              # 認証が必要なルート
│   │   │   ├── upload/          # 作品投稿
│   │   │   ├── dashboard/       # クリエイターダッシュボード
│   │   │   └── settings/        # アカウント設定
│   │   └── api/                 # API Routes
│   │       ├── auth/            # NextAuth
│   │       ├── works/           # 作品CRUD
│   │       ├── likes/           # いいね
│   │       ├── follows/         # フォロー
│   │       ├── comments/        # コメント
│   │       └── ranking/         # ランキング集計
│   ├── components/
│   │   ├── ui/                  # shadcn/ui ベースの汎用コンポーネント
│   │   ├── works/               # 作品関連コンポーネント
│   │   │   ├── WorkCard.tsx     # フィード用カード
│   │   │   ├── WorkViewer.tsx   # 4コマ表示（詳細）
│   │   │   ├── WorkFeed.tsx     # フィード一覧
│   │   │   └── WorkUploadForm.tsx
│   │   ├── ranking/             # ランキング関連
│   │   ├── creator/             # 作家関連
│   │   └── layout/              # ヘッダー・フッター等
│   ├── lib/
│   │   ├── prisma.ts            # Prisma クライアント
│   │   ├── auth.ts              # NextAuth 設定
│   │   ├── utils.ts             # 汎用ユーティリティ
│   │   ├── ranking.ts           # ランキング計算ロジック
│   │   └── ogp.ts               # OGP画像生成
│   ├── hooks/                   # カスタムフック
│   ├── store/                   # Zustand ストア
│   └── types/                   # TypeScript 型定義
├── prisma/
│   ├── schema.prisma            # DBスキーマ
│   └── seed.ts                  # シードデータ
├── public/                      # 静的ファイル
├── .env.example                 # 環境変数テンプレート
├── docker-compose.yml           # ローカルDB環境
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗄️ データベーススキーマ（Prisma）

詳細は `docs/db-schema.md` を参照。以下は主要モデルの概要。

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  bio           String?
  xHandle       String?   // @username
  isCreator     Boolean   @default(false)
  works         Work[]
  likes         Like[]
  comments      Comment[]
  followers     Follow[]  @relation("following")
  following     Follow[]  @relation("follower")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Work {
  id          String    @id @default(cuid())
  title       String
  description String?
  panels      String[]  // 4枚の画像URL（順番通り）
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  genreTags   Tag[]
  likes       Like[]
  comments    Comment[]
  viewCount   Int       @default(0)
  likeCount   Int       @default(0)  // 非正規化（パフォーマンス用）
  isPublished Boolean   @default(true)
  xPostUrl    String?   // 元のXポスト URL（任意）
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique  // "日常", "ギャグ", "育児", "猫", "仕事", "恋愛", "感動", "エッセイ"
  slug  String @unique  // "nichijou", "gag", "ikuji", "neko", "shigoto", "renai", "kando", "essay"
  works Work[]
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  workId    String
  user      User     @relation(fields: [userId], references: [id])
  work      Work     @relation(fields: [workId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, workId])
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  userId    String
  workId    String
  user      User     @relation(fields: [userId], references: [id])
  work      Work     @relation(fields: [workId], references: [id])
  createdAt DateTime @default(now())
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  follower    User     @relation("follower", fields: [followerId], references: [id])
  following   User     @relation("following", fields: [followingId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}

model WeeklyRanking {
  id        String   @id @default(cuid())
  workId    String   @unique
  score     Int      // いいね数 × 2 + 閲覧数
  rank      Int
  weekStart DateTime // その週の月曜日
  createdAt DateTime @default(now())
}
```

---

## 🎨 UIデザイン方針

詳細は `docs/design-guidelines.md` を参照。

- **モバイルファースト:** スマホ（375px〜）を基準に設計。PCはおまけ程度でOK。
- **コンテンツ密度:** フィードはカード型。1画面に2〜3作品が見えるくらいの大きさ。
- **カラーパレット:**
  - Primary: `#3B82F6`（青）
  - Background: `#FAFAFA`
  - Card: `#FFFFFF`
  - Text: `#1F2937`
  - Muted: `#6B7280`
- **フォント:** システムフォント優先（`font-sans`）
- **4コマの表示:** 縦スクロールで4枚を連続表示。各コマは横幅100%で表示。
- **広告枠:** フィードの5件ごと・作品詳細のコメント前に挿入。AdSense用の`div`を配置しておく。

---

## 🚀 MVP実装の優先順位

### P0（最初にリリースするもの・これがないとサービスにならない）

1. **作品表示（読者向け）**
   - フィード画面（新着順・人気順タブ）
   - ジャンル別一覧
   - 作品詳細ページ（4コマビューワー）
   - 作家ページ

2. **作品投稿（クリエイター向け）**
   - 4枚画像アップロード
   - タイトル・説明・ジャンルタグ設定
   - 投稿後プレビュー

3. **認証**
   - Xログイン・Googleログイン
   - ゲストは閲覧のみ可能

4. **週間ランキング**
   - 毎週月曜0時に集計バッチ実行
   - TOP 20 表示

5. **広告枠**
   - AdSense 用 `<div>` をフィード・詳細ページに配置

### P1（リリース直後に追加）

- いいね機能
- コメント機能
- フォロー機能
- OGP画像自動生成（Xシェア時に4コマ1枚目がサムネになる）
- X自動シェアボタン（投稿完了時）
- クリエイターダッシュボード（閲覧数・いいね数）
- 検索（キーワード・タグ・作家名）

### P2（Phase 2）

- 投げ銭・チップ機能（Stripe）
- クリエイターサブスク
- 広告非表示プレミアム
- プッシュ通知（PWA）
- X連携「1タップ同期」機能

---

## 🔌 外部API・サービス

```env
# .env.example

# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# OAuth
TWITTER_CLIENT_ID="..."
TWITTER_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# File Upload（Uploadthing）
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

# Redis（Upstash）
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Google AdSense（本番のみ）
NEXT_PUBLIC_ADSENSE_ID="ca-pub-XXXXXXXXXX"

# X API（Phase 2 - 1タップ同期用）
TWITTER_BEARER_TOKEN="..."
```

---

## ⚙️ ローカル開発セットアップ

```bash
# 1. リポジトリをクローン後
pnpm install

# 2. Docker でローカルDB起動
docker-compose up -d

# 3. 環境変数を設定
cp .env.example .env.local
# .env.local を編集して各値を設定

# 4. DBマイグレーション実行
pnpm prisma migrate dev

# 5. シードデータ投入（任意）
pnpm prisma db seed

# 6. 開発サーバー起動
pnpm dev
```

### docker-compose.yml（参考）

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: komapara
      POSTGRES_PASSWORD: komapara
      POSTGRES_DB: komapara
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 🛠️ コーディング規約

- **命名規則:** コンポーネントは PascalCase、関数・変数は camelCase、ファイルは kebab-case
- **コンポーネント:** Server Component を原則とし、インタラクションが必要な部分だけ `'use client'`
- **エラーハンドリング:** API Routes では必ず try-catch。エラーレスポンスは `{ error: string }` 形式
- **型安全:** `any` 型の使用は禁止。Zod でバリデーションスキーマを定義する
- **画像:** 必ず `next/image` を使用。外部ドメインは `next.config.ts` の `remotePatterns` に追加
- **アクセシビリティ:** img タグには alt 属性必須。インタラクティブ要素には aria ラベルを付ける

---

## 📋 実装時の重要な注意事項

### 4コマビューワーの実装

4コマは必ず **1枚目〜4枚目の順番を保持** して表示する。
- DB上は `panels: String[]`（配列）で順番管理
- アップロード時に順番を確定（ドラッグ&ドロップで並び替え可能にする）
- 詳細ページでは縦に1枚ずつ表示（横スクロールではなく縦スクロール）

### ランキング集計

週間ランキングのスコアは以下の式で計算：
```
score = (likeCount × 2) + viewCount
```
- 集計は毎週月曜日 00:00 JST に実行
- Vercel Cron Jobs（`/api/cron/weekly-ranking`）で実装
- 集計結果は `WeeklyRanking` テーブルに保存（履歴管理）

### OGP画像生成

作品詳細ページの OGP は Next.js の `ImageResponse`（`next/og`）で動的生成：
- 1コマ目の画像 + タイトル + 作家名をレイアウト
- `/api/og/work/[id]` エンドポイントで生成
- Twitter Card は `summary_large_image` を使用

### 広告の実装

AdSense の実装は `<AdsenseUnit>` コンポーネントに集約：
```tsx
// components/ui/AdsenseUnit.tsx
// 環境変数 NEXT_PUBLIC_ADSENSE_ID が設定されている本番環境のみ表示
// 開発環境では グレーのプレースホルダーを表示する
```

---

## 📝 作業ログ

実装した機能・変更内容をここに追記していく。

| 日付 | 実装内容 | 状態 |
|------|----------|------|
| 2026-02-27 | プロジェクト初期セットアップ | 完了 |
| 2026-02-27 | Prismaスキーマ・DB push | 完了 |
| 2026-02-27 | 認証（NextAuth + X/Googleログイン） | 完了 |
| 2026-02-27 | 作品投稿フォーム | 完了 |
| 2026-02-27 | フィード画面 | 完了 |
| 2026-02-27 | 作品詳細ページ（4コマビューワー） | 完了 |
| 2026-02-27 | ジャンル別一覧 | 完了 |
| 2026-02-27 | 作家ページ | 完了 |
| 2026-02-27 | 週間ランキング | 完了 |
| 2026-02-27 | いいね機能 | 完了 |
| 2026-02-27 | フォロー機能 | 完了 |
| 2026-02-27 | コメント機能 | 完了 |
| 2026-02-27 | 検索機能 | 完了 |
| 2026-02-27 | AdSense広告枠 | 完了 |
| 2026-02-27 | サンプルシードデータ投入 | 完了 |
| - | OGP自動生成 | 未着手 |
