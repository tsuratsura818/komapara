# API仕様書

## 共通ルール

- すべてのレスポンスは JSON
- エラーレスポンス形式: `{ "error": "エラーメッセージ" }`
- 認証エラー: HTTP 401
- 権限エラー: HTTP 403
- Not Found: HTTP 404
- バリデーションエラー: HTTP 400 `{ "error": "...", "fields": { ... } }`
- ページネーション: `?page=1&limit=20`（デフォルト: limit=20）

---

## 作品 API

### GET `/api/works`
作品一覧を取得する。

**クエリパラメータ:**
| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `sort` | `"new"` \| `"popular"` | `"new"` | ソート順 |
| `genre` | string | - | ジャンルslugで絞り込み |
| `page` | number | 1 | ページ番号 |
| `limit` | number | 20 | 1ページの件数（最大50） |

**レスポンス:**
```json
{
  "works": [
    {
      "id": "clxxx",
      "title": "作品タイトル",
      "panels": ["https://...", "https://...", "https://...", "https://..."],
      "author": {
        "id": "clyyy",
        "name": "作家名",
        "image": "https://..."
      },
      "genres": [{ "name": "日常", "slug": "nichijou" }],
      "likeCount": 42,
      "viewCount": 300,
      "createdAt": "2026-02-27T10:00:00Z",
      "isLiked": false
    }
  ],
  "totalCount": 150,
  "page": 1,
  "totalPages": 8
}
```

---

### GET `/api/works/[id]`
作品詳細を取得する。閲覧数を +1 インクリメントする。

**レスポンス:**
```json
{
  "id": "clxxx",
  "title": "作品タイトル",
  "description": "説明文",
  "panels": ["https://...", "https://...", "https://...", "https://..."],
  "author": {
    "id": "clyyy",
    "name": "作家名",
    "image": "https://...",
    "bio": "自己紹介",
    "xHandle": "username"
  },
  "genres": [{ "name": "日常", "slug": "nichijou" }],
  "likeCount": 42,
  "viewCount": 301,
  "xPostUrl": "https://x.com/...",
  "createdAt": "2026-02-27T10:00:00Z",
  "isLiked": false,
  "isFollowingAuthor": false
}
```

---

### POST `/api/works`
作品を投稿する。**認証必須。**

**リクエストボディ:**
```json
{
  "title": "作品タイトル",
  "description": "説明文（任意）",
  "panels": ["imageKey1", "imageKey2", "imageKey3", "imageKey4"],
  "genreSlugs": ["nichijou", "neko"],
  "xPostUrl": "https://x.com/..."
}
```

**バリデーション:**
- `title`: 必須・1〜50文字
- `panels`: 必須・4要素の配列
- `genreSlugs`: 任意・最大3つ

**レスポンス:** `201 Created` + 作品オブジェクト

---

### DELETE `/api/works/[id]`
作品を削除する。**本人のみ。**

**レスポンス:** `204 No Content`

---

## いいね API

### POST `/api/likes/[workId]`
いいねを追加する。**認証必須。**

**レスポンス:**
```json
{ "likeCount": 43 }
```

### DELETE `/api/likes/[workId]`
いいねを取り消す。**認証必須。**

**レスポンス:**
```json
{ "likeCount": 42 }
```

---

## フォロー API

### POST `/api/follows/[userId]`
ユーザーをフォローする。**認証必須。自分自身はフォロー不可。**

**レスポンス:** `201 Created`

### DELETE `/api/follows/[userId]`
フォローを解除する。**認証必須。**

**レスポンス:** `204 No Content`

---

## コメント API

### GET `/api/comments/[workId]`
コメント一覧を取得。

**クエリ:** `?page=1&limit=30`

**レスポンス:**
```json
{
  "comments": [
    {
      "id": "clzzz",
      "body": "面白かったです！",
      "user": { "id": "...", "name": "...", "image": "..." },
      "createdAt": "2026-02-27T10:00:00Z"
    }
  ],
  "totalCount": 5
}
```

### POST `/api/comments/[workId]`
コメントを投稿。**認証必須。**

**リクエストボディ:**
```json
{ "body": "面白かったです！" }
```
- `body`: 必須・1〜500文字

**レスポンス:** `201 Created` + コメントオブジェクト

---

## ランキング API

### GET `/api/ranking/weekly`
最新の週間ランキングを取得。

**クエリ:** `?limit=20`

**レスポンス:**
```json
{
  "weekStart": "2026-02-23",
  "rankings": [
    {
      "rank": 1,
      "score": 542,
      "work": { /* 作品オブジェクト */ }
    }
  ]
}
```

---

## 作家 API

### GET `/api/creators/[id]`
作家プロフィールと作品一覧を取得。

**レスポンス:**
```json
{
  "id": "clyyy",
  "name": "作家名",
  "image": "https://...",
  "bio": "自己紹介",
  "xHandle": "username",
  "followerCount": 120,
  "workCount": 45,
  "isFollowing": false,
  "works": [ /* 作品オブジェクトの配列 */ ]
}
```

---

## 検索 API

### GET `/api/search`

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|---|---|---|
| `q` | string | 検索キーワード |
| `type` | `"works"` \| `"creators"` | 検索対象（デフォルト: `"works"`） |

**レスポンス（type=works）:**
```json
{
  "works": [ /* 作品オブジェクトの配列 */ ],
  "totalCount": 12
}
```

---

## OGP API

### GET `/api/og/work/[id]`
作品の OGP 画像を動的生成する（`next/og` の `ImageResponse` を使用）。

- サイズ: 1200 × 630px
- 内容: 1コマ目の画像 + タイトル + 作家名 + コマパラロゴ

---

## Cron API

### POST `/api/cron/weekly-ranking`
週間ランキングを集計してDBに保存する。

**認証:** `Authorization: Bearer {CRON_SECRET}` ヘッダー

**処理内容:**
1. 直近7日間の `Work` を `likeCount × 2 + viewCount` でスコア計算
2. TOP 20 を `WeeklyRanking` テーブルに upsert
3. `weekStart`（その週の月曜日）をキーに管理

**Vercel Cron 設定（`vercel.json`）:**
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-ranking",
      "schedule": "0 15 * * 0"
    }
  ]
}
```
（UTC 15:00日曜 = JST 月曜 00:00）
