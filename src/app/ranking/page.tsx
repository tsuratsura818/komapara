import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/ranking";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "週間ランキング",
};

export default async function RankingPage() {
  const weekStart = getWeekStart();

  const rankings = await prisma.weeklyRanking.findMany({
    where: { weekStart },
    include: {
      work: {
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: { select: { name: true, slug: true, emoji: true } },
        },
      },
    },
    orderBy: { rank: "asc" },
    take: 20,
  });

  const weekLabel = weekStart.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-komapara-text">週間ランキング</h1>
      <p className="text-sm text-komapara-muted mt-1">
        {weekLabel}〜 の週間TOP20
      </p>

      {rankings.length > 0 ? (
        <div className="mt-6 space-y-3">
          {rankings.map((entry) => (
            <Link
              key={entry.id}
              href={`/work/${entry.work.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-komapara-border p-3 hover:shadow-sm transition-shadow"
            >
              {/* 順位 */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  entry.rank === 1
                    ? "bg-yellow-100 text-yellow-700"
                    : entry.rank === 2
                      ? "bg-gray-100 text-gray-600"
                      : entry.rank === 3
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-50 text-komapara-muted"
                }`}
              >
                {entry.rank}
              </div>

              {/* サムネイル */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {entry.work.panels[0] && (
                  <img
                    src={entry.work.panels[0]}
                    alt={entry.work.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* 情報 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-komapara-text truncate">
                  {entry.work.title}
                </h3>
                <p className="text-xs text-komapara-muted">
                  {entry.work.author.name}
                </p>
                <div className="flex gap-3 mt-0.5 text-xs text-komapara-muted">
                  <span>♥ {entry.work.likeCount}</span>
                  <span>👁 {entry.work.viewCount}</span>
                  <span className="text-primary-500">
                    スコア: {entry.score}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-komapara-muted">
          <p>まだランキングデータがありません</p>
          <p className="text-sm mt-1">毎週月曜日に集計されます</p>
        </div>
      )}
    </div>
  );
}
