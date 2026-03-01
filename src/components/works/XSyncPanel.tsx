"use client";

import { useState } from "react";
import { GENRES } from "@/lib/utils";

type XPost = {
  xPostUrl: string;
  tweetId: string;
  images: string[];
  text: string;
  author: string;
  is4koma: boolean;
  error?: string;
  // ユーザー入力
  selected?: boolean;
  title?: string;
  description?: string;
  genreSlugs?: string[];
};

type ImportResult = {
  xPostUrl: string;
  workId: string | null;
  error: string | null;
};

export function XSyncPanel() {
  const [urlInput, setUrlInput] = useState("");
  const [posts, setPosts] = useState<XPost[]>([]);
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    setError("");
    setResults([]);

    const urls = urlInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setError("URLを1つ以上入力してください");
      return;
    }

    setFetching(true);
    try {
      const res = await fetch("/api/x-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "取得に失敗しました");
        return;
      }

      setPosts(
        data.posts.map((p: XPost) => ({
          ...p,
          selected: p.is4koma,
          title: p.text?.slice(0, 50) || "",
          description: p.text?.slice(0, 200) || "",
          genreSlugs: [],
        }))
      );
    } catch {
      setError("取得に失敗しました");
    } finally {
      setFetching(false);
    }
  };

  const toggleSelect = (index: number) => {
    setPosts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const updatePost = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    setPosts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const toggleGenre = (index: number, slug: string) => {
    setPosts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const genres = p.genreSlugs || [];
        return {
          ...p,
          genreSlugs: genres.includes(slug)
            ? genres.filter((s) => s !== slug)
            : genres.length < 3
              ? [...genres, slug]
              : genres,
        };
      })
    );
  };

  const handleImport = async () => {
    const selected = posts.filter((p) => p.selected && p.is4koma);
    if (selected.length === 0) {
      setError("インポートする投稿を選択してください（1〜16枚画像の投稿のみ対応）");
      return;
    }

    const missingTitle = selected.find((p) => !p.title?.trim());
    if (missingTitle) {
      setError("すべての選択した投稿にタイトルを入力してください");
      return;
    }

    setError("");
    setImporting(true);
    try {
      const res = await fetch("/api/x-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: [],
          action: "import",
          posts: selected.map((p) => ({
            xPostUrl: p.xPostUrl,
            title: p.title,
            description: p.description,
            genreSlugs: p.genreSlugs,
            images: p.images,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "インポートに失敗しました");
        return;
      }

      setResults(data.results);
      // 成功した投稿を選択解除
      setPosts((prev) =>
        prev.map((p) => {
          const result = data.results.find(
            (r: ImportResult) => r.xPostUrl === p.xPostUrl
          );
          return result?.workId ? { ...p, selected: false } : p;
        })
      );
    } catch {
      setError("インポートに失敗しました");
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = posts.filter((p) => p.selected && p.is4koma).length;
  const successCount = results.filter((r) => r.workId).length;

  return (
    <div className="glass rounded-xl border border-white/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <h2 className="text-sm font-semibold text-komapara-text">
          X 1タップ同期
        </h2>
      </div>

      <div className="p-4">
        {/* URL入力 */}
        <div className="mb-4">
          <p className="text-xs text-komapara-muted mb-2">
            X投稿のURLを貼り付け（改行またはカンマ区切りで複数OK、最大20件）
          </p>
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={`https://x.com/user/status/123456\nhttps://x.com/user/status/789012`}
            rows={3}
            className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            disabled={fetching}
          />
          <button
            onClick={handleFetch}
            disabled={fetching || !urlInput.trim()}
            className="mt-2 w-full py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {fetching ? "取得中..." : "投稿を取得"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-komapara-like text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* 取得結果 */}
        {posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div
                key={post.tweetId || index}
                className={`rounded-lg border p-3 transition-colors ${
                  post.error
                    ? "border-red-200 bg-red-50/30"
                    : post.selected
                      ? "border-primary-300 bg-primary-50/30"
                      : "border-komapara-border"
                }`}
              >
                {post.error ? (
                  <div className="text-sm text-komapara-like">
                    <span className="font-medium">エラー:</span> {post.error}
                    <p className="text-xs text-komapara-muted mt-1 break-all">
                      {post.xPostUrl}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ヘッダー */}
                    <div className="flex items-start gap-3 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={post.selected || false}
                          onChange={() => toggleSelect(index)}
                          disabled={!post.is4koma}
                          className="w-4 h-4 accent-primary-500"
                        />
                        <div className="min-w-0">
                          <span className="text-xs text-komapara-muted">
                            @{post.author}
                          </span>
                          {!post.is4koma && (
                            <span className="ml-2 text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                              {post.images.length}枚（画像なしのため選択不可）
                            </span>
                          )}
                          {post.is4koma && (
                            <span className="ml-2 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              {post.images.length}枚
                            </span>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* 画像プレビュー */}
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {post.images.slice(0, 16).map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt={`${imgIdx + 1}コマ目`}
                          className="w-full aspect-square object-cover rounded"
                        />
                      ))}
                    </div>

                    {/* タイトル・説明入力（選択時のみ） */}
                    {post.selected && post.is4koma && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
                        <input
                          type="text"
                          value={post.title || ""}
                          onChange={(e) =>
                            updatePost(index, "title", e.target.value)
                          }
                          maxLength={50}
                          placeholder="タイトル（必須）"
                          className="w-full px-2 py-1.5 border border-komapara-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <input
                          type="text"
                          value={post.description || ""}
                          onChange={(e) =>
                            updatePost(index, "description", e.target.value)
                          }
                          maxLength={200}
                          placeholder="説明（任意）"
                          className="w-full px-2 py-1.5 border border-komapara-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <div className="flex flex-wrap gap-1">
                          {GENRES.map((genre) => (
                            <button
                              key={genre.slug}
                              type="button"
                              onClick={() => toggleGenre(index, genre.slug)}
                              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                                post.genreSlugs?.includes(genre.slug)
                                  ? "bg-primary-500 text-white"
                                  : "bg-komapara-tag text-komapara-tag-text hover:bg-primary-100"
                              }`}
                            >
                              {genre.emoji} {genre.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* インポートボタン */}
            {selectedCount > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-3 text-white font-semibold bg-gradient-main rounded-xl hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {importing
                  ? "インポート中..."
                  : `${selectedCount}件をインポート`}
              </button>
            )}
          </div>
        )}

        {/* インポート結果 */}
        {results.length > 0 && (
          <div className="mt-4 p-3 glass rounded-lg">
            <p className="text-sm font-medium text-komapara-text mb-2">
              インポート結果: {successCount}/{results.length}件 成功
            </p>
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {r.workId ? (
                    <>
                      <span className="text-green-600">✓</span>
                      <a
                        href={`/work/${r.workId}`}
                        className="text-primary-500 hover:underline"
                      >
                        作品を見る
                      </a>
                    </>
                  ) : (
                    <>
                      <span className="text-komapara-like">✕</span>
                      <span className="text-komapara-muted">{r.error}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
