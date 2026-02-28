"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { WorkCard } from "./WorkCard";
import { AdsenseUnit } from "@/components/ui/AdsenseUnit";
import { cn } from "@/lib/utils";

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

export function WorkFeed() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("new");
  const [works, setWorks] = useState<Work[]>([]);
  const [, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchWorks = useCallback(
    async (pageNum: number, reset = false) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/works?sort=${tab}&page=${pageNum}&limit=20`
        );
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
    [tab]
  );

  // タブ変更時にリセット
  useEffect(() => {
    setPage(1);
    fetchWorks(1, true);
  }, [tab, fetchWorks]);

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
      {/* タブ */}
      <div className="flex glass border-b border-white/20 sticky top-14 z-40">
        {tabs.map((t) => {
          if (t.requireAuth && !session) return null;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                tab === t.value
                  ? "gradient-text"
                  : "text-komapara-muted hover:text-komapara-text"
              )}
            >
              {t.label}
              {tab === t.value && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-main rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 作品グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
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
                <AdsenseUnit slot={`feed-${index}`} isPremium={session?.user?.isPremium ?? false} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* スケルトンローディング */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden glass"
            >
              <div className="aspect-square skeleton-shimmer" />
              <div className="p-3 space-y-2">
                <div className="h-3 skeleton-shimmer rounded w-1/3" />
                <div className="h-4 skeleton-shimmer rounded" />
                <div className="h-3 skeleton-shimmer rounded w-2/3" />
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
