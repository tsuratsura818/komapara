"use client";

import { useState } from "react";
import { WorkCard } from "@/components/works/WorkCard";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

const REACTION_EMOJI: Record<string, string> = {
  like: "❤️",
  laugh: "😂",
  cry: "😢",
  empathy: "🤝",
  amazing: "✨",
};

type WorkData = {
  id: string;
  title: string;
  panels: string[];
  author: { id: string; name: string | null; image: string | null };
  genres: { name: string; slug: string; emoji: string }[];
  likeCount: number;
  createdAt: string;
};

type LikedWork = WorkData & { reaction: string };
type ReadWork = WorkData & { readAt: string };

export function LibraryTabs({
  likedWorks,
  readWorks,
}: {
  likedWorks: LikedWork[];
  readWorks: ReadWork[];
}) {
  const [tab, setTab] = useState<"liked" | "history">("liked");

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-main px-4 py-5 text-white rounded-b-2xl">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📚</span> マイライブラリ
        </h1>
        <p className="text-white/80 text-sm mt-1">
          リアクション {likedWorks.length} ・ 閲覧履歴 {readWorks.length}
        </p>
      </div>

      {/* タブ */}
      <div className="flex border-b border-komapara-border/50 px-4 mt-2">
        <button
          onClick={() => setTab("liked")}
          className={`flex-1 py-3 text-sm font-medium text-center transition-all ${
            tab === "liked"
              ? "gradient-text border-b-2 border-purple-500"
              : "text-komapara-muted hover:text-komapara-text"
          }`}
        >
          ❤️ リアクション ({likedWorks.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-3 text-sm font-medium text-center transition-all ${
            tab === "history"
              ? "gradient-text border-b-2 border-purple-500"
              : "text-komapara-muted hover:text-komapara-text"
          }`}
        >
          📖 読んだ履歴 ({readWorks.length})
        </button>
      </div>

      <div className="px-4 py-4">
        {tab === "liked" && (
          <>
            {likedWorks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {likedWorks.map((work) => (
                  <div key={work.id} className="relative">
                    {work.reaction !== "like" && (
                      <div className="absolute top-2 right-2 z-10 text-lg bg-white/80 rounded-full w-7 h-7 flex items-center justify-center shadow-xs">
                        {REACTION_EMOJI[work.reaction] || "❤️"}
                      </div>
                    )}
                    <WorkCard
                      id={work.id}
                      title={work.title}
                      panels={work.panels}
                      author={work.author}
                      genres={work.genres}
                      likeCount={work.likeCount}
                      createdAt={work.createdAt}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message="まだリアクションした作品がありません"
                sub="気になる作品にリアクションして、ライブラリに追加しましょう"
              />
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {readWorks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {readWorks.map((work) => (
                  <div key={`${work.id}-${work.readAt}`} className="relative">
                    <div className="absolute top-2 left-2 z-10 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                      {formatRelativeTime(work.readAt)}
                    </div>
                    <WorkCard
                      id={work.id}
                      title={work.title}
                      panels={work.panels}
                      author={work.author}
                      genres={work.genres}
                      likeCount={work.likeCount}
                      createdAt={work.createdAt}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message="まだ閲覧履歴がありません"
                sub="作品を読むと自動的に履歴に追加されます"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="text-center py-16 text-komapara-muted glass rounded-xl">
      <p className="text-lg mb-2">{message}</p>
      <p className="text-sm mb-4">{sub}</p>
      <Link
        href="/"
        className="inline-block px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
      >
        作品を探す
      </Link>
    </div>
  );
}
