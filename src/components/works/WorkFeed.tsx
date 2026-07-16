"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { WorkCard } from "./WorkCard";
import { AdSlot } from "@/components/ui/AdSlot";
import { GenreIcon } from "@/components/ui/GenreIcons";
import { cn, GENRES } from "@/lib/utils";

type Work = {
  id: string;
  title: string;
  panels: string[];
  author: { id: string; name: string | null; image: string | null };
  genres: { name: string; slug: string; emoji: string }[];
  likeCount: number;
  viewCount: number;
  createdAt: string;
  isLiked: boolean;
};

type Tab = "new" | "popular" | "following";

type Ad = {
  id: string;
  company: string;
  imageUrl: string;
  linkUrl: string;
  description: string | null;
};

type WorkFeedProps = {
  initialWorks?: Work[];
  initialTotalPages?: number;
  feedAds?: Ad[];
};

export function WorkFeed({ initialWorks, initialTotalPages, feedAds = [] }: WorkFeedProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("new");
  const [genre, setGenre] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // 打鍵ごとに叩かないよう、入力が落ち着いてから検索語を確定させる
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [works, setWorks] = useState<Work[]>(initialWorks ?? []);
  const [, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(
    initialTotalPages ? 1 < initialTotalPages : true
  );
  const [loading, setLoading] = useState(!initialWorks);
  const observerRef = useRef<HTMLDivElement>(null);
  const initialLoadSkipped = useRef(!!initialWorks);

  const fetchWorks = useCallback(
    async (pageNum: number, reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sort: tab, page: String(pageNum), limit: "20" });
        if (genre) params.set("genre", genre);
        if (debouncedQuery) params.set("q", debouncedQuery);
        const res = await fetch(`/api/works?${params}`);
        const data = await res.json();
        const newWorks = data.works ?? [];

        if (reset) {
          setWorks(newWorks);
        } else {
          setWorks((prev) => [...prev, ...newWorks]);
        }
        setHasMore(pageNum < (data.totalPages ?? 1));
      } catch (error) {
        console.error("Failed to fetch works:", error);
      } finally {
        setLoading(false);
      }
    },
    [tab, genre, debouncedQuery]
  );

  // 入力が落ち着いてから検索語を確定（打鍵ごとのリクエストを防ぐ）
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // タブ / カテゴリ / 検索語の変更時にリセット（初回はスキップ）
  useEffect(() => {
    if (initialLoadSkipped.current) {
      initialLoadSkipped.current = false;
      return;
    }
    setPage(1);
    fetchWorks(1, true);
  }, [tab, genre, debouncedQuery, fetchWorks]);

  // 無限スクロール
  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => {
            const next = prev + 1;
            fetchWorks(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchWorks]);

  const tabs: { value: Tab; label: string; requireAuth?: boolean }[] = [
    { value: "new", label: "新着" },
    { value: "popular", label: "人気" },
    { value: "following", label: "フォロー中", requireAuth: true },
  ];

  return (
    <div>
      {/* タブ + キーワード検索
          下線タブは「選択中」しか主張せず、他も選べることが伝わらなかったため、
          枠で囲ったセグメンテッドコントロールにして切り替え可能なことを明示する。 */}
      <div className="glass border-b border-white/20 sticky top-16 sm:top-20 z-40 px-4 py-2 flex items-center gap-3">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-gray-100/80 shrink-0">
          {tabs.map((t) => {
            if (t.requireAuth && !session) return null;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                aria-pressed={active}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap",
                  active
                    ? "bg-white text-blue-600 font-semibold shadow-sm"
                    : "text-gray-500 font-medium hover:text-gray-900"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 検索は画面遷移させず、この場でフィードを絞り込む */}
        <div className="relative flex-1 min-w-0 max-w-xs">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="作品・作家を検索"
            aria-label="作品・作家を検索"
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {query.trim() && !loading && (
        <p className="px-4 pt-3 text-xs text-komapara-muted">
          「{query.trim()}」の検索結果 {works.length}件
        </p>
      )}

      {/* カテゴリフィルター */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setGenre(null)}
          className={cn(
            "px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all shrink-0",
            genre === null
              ? "bg-gradient-main text-white shadow-md shadow-blue-500/25"
              : "glass text-komapara-muted hover:text-komapara-text"
          )}
        >
          すべて
        </button>
        {GENRES.map((g) => (
          <button
            key={g.slug}
            onClick={() => setGenre(genre === g.slug ? null : g.slug)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all shrink-0",
              genre === g.slug
                ? "bg-gradient-main text-white shadow-md shadow-blue-500/25"
                : "glass text-komapara-muted hover:text-komapara-text"
            )}
          >
            <GenreIcon slug={g.slug} className="w-3.5 h-3.5" />
            {g.name}
          </button>
        ))}
      </div>

      {/* 作品グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 p-3 sm:p-4">
        {works.map((work, index) => (
          <div
            key={work.id}
          >
            <WorkCard
              id={work.id}
              title={work.title}
              panels={work.panels}
              author={work.author}
              genres={work.genres}
              likeCount={work.likeCount}
              createdAt={work.createdAt}
            />
            {/* 5件ごとに広告挿入 */}
            {(index + 1) % 5 === 0 && (
              <div className="mt-4">
                <AdSlot
                  ad={feedAds.length > 0 ? feedAds[Math.floor(index / 5) % feedAds.length] : null}
                  slot={`feed-${index}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* スケルトンローディング */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 p-3 sm:p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden glass"
            >
              <div className="aspect-square skeleton-shimmer" />
              <div className="p-3 space-y-2">
                <div className="h-3 skeleton-shimmer rounded-sm w-1/3" />
                <div className="h-4 skeleton-shimmer rounded-sm" />
                <div className="h-3 skeleton-shimmer rounded-sm w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空の状態 */}
      {!loading && works.length === 0 && (
        <div className="text-center py-20 text-komapara-muted">
          <p className="text-lg mb-2">まだ作品がありません</p>
          <p className="text-sm">最初の4コマを投稿してみましょう！</p>
        </div>
      )}

      {/* 無限スクロール用のトリガー */}
      {hasMore && <div ref={observerRef} className="h-10" />}
    </div>
  );
}
