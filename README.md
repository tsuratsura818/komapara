# コマパラ（Komapara）

4コマ漫画に特化した読者向けポータルサービス

## クイックスタート

```bash
# 依存関係インストール
pnpm install

# ローカルDB起動（Docker必須）
docker-compose up -d

# 環境変数設定
cp .env.example .env.local
# .env.local を編集

# DBセットアップ
pnpm prisma migrate dev
pnpm prisma db seed

# 開発サーバー起動
pnpm dev
```

→ http://localhost:3000 で確認

## ドキュメント

| ファイル | 内容 |
|----------|------|
| `CLAUDE.md` | **Claude Code 向け開発指示書**（開発時は必ずこれを読む） |
| `docs/spec.md` | 機能仕様書 |
| `docs/api-spec.md` | API仕様書 |
| `docs/design-guidelines.md` | UIデザインガイドライン |
| `docs/db-schema.md` | DBスキーマ詳細 |

## 技術スタック

- **フロントエンド/バックエンド:** Next.js 14（App Router）+ TypeScript
- **DB:** PostgreSQL + Prisma
- **認証:** NextAuth.js v5
- **スタイリング:** Tailwind CSS + shadcn/ui
- **ホスティング:** Vercel（予定）

## Claude Code での開発方法

```bash
# プロジェクトルートで Claude Code を起動
claude

# 例：フィード画面を作ってもらう
> フィード画面（/）を実装してください。CLAUDE.md と docs/spec.md を参照してください。

# 例：作品投稿フォームを作ってもらう
> 作品投稿フォーム（/upload）を実装してください。
```
