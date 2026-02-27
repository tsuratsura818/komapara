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

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div>
      {/* Gradient header */}
      <div className="bg-gradient-main px-4 py-6 text-white rounded-b-2xl">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🏆</span> 週間ランキング
        </h1>
        <p className="text-white/80 text-sm mt-1">{weekLabel}〜 の週間TOP20</p>
      </div>

      {rankings.length > 0 ? (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="flex justify-center items-end gap-3 px-4 pt-6 pb-4">
              {/* 2nd place */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-ranking-silver shadow-lg mb-2 overflow-hidden">
                  {top3[1].work.panels[0] && (
                    <img
                      src={top3[1].work.panels[0]}
                      alt={top3[1].work.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="bg-gradient-ranking-silver text-white text-sm font-bold py-1 rounded-t-lg">
                  2
                </div>
                <Link
                  href={`/work/${top3[1].work.id}`}
                  className="block bg-white rounded-b-lg p-2 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-xs font-semibold truncate">
                    {top3[1].work.title}
                  </p>
                  <p className="text-[10px] text-komapara-muted truncate">
                    {top3[1].work.author.name}
                  </p>
                </Link>
              </div>

              {/* 1st place */}
              <div className="flex-1 text-center -mt-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-ranking-gold shadow-lg shadow-yellow-500/30 mb-2 overflow-hidden ring-4 ring-yellow-300/50">
                  {top3[0].work.panels[0] && (
                    <img
                      src={top3[0].work.panels[0]}
                      alt={top3[0].work.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="bg-gradient-ranking-gold text-white text-lg font-bold py-2 rounded-t-lg">
                  👑 1
                </div>
                <Link
                  href={`/work/${top3[0].work.id}`}
                  className="block bg-white rounded-b-lg p-2 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-xs font-semibold truncate">
                    {top3[0].work.title}
                  </p>
                  <p className="text-[10px] text-komapara-muted truncate">
                    {top3[0].work.author.name}
                  </p>
                </Link>
              </div>

              {/* 3rd place */}
              <div className="flex-1 text-center mt-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-ranking-bronze shadow-lg mb-2 overflow-hidden">
                  {top3[2].work.panels[0] && (
                    <img
                      src={top3[2].work.panels[0]}
                      alt={top3[2].work.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="bg-gradient-ranking-bronze text-white text-sm font-bold py-1 rounded-t-lg">
                  3
                </div>
                <Link
                  href={`/work/${top3[2].work.id}`}
                  className="block bg-white rounded-b-lg p-2 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-xs font-semibold truncate">
                    {top3[2].work.title}
                  </p>
                  <p className="text-[10px] text-komapara-muted truncate">
                    {top3[2].work.author.name}
                  </p>
                </Link>
              </div>
            </div>
          )}

          {/* Rank 4+ */}
          <div className="px-4 pb-6 space-y-3">
            {rest.map((entry, index) => (
              <Link
                key={entry.id}
                href={`/work/${entry.work.id}`}
                className="flex items-center gap-3 glass rounded-xl p-3 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 animate-fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                {/* 順位 */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center font-bold text-sm text-komapara-muted">
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
                    <span className="text-pink-500">♥ {entry.work.likeCount}</span>
                    <span>👁 {entry.work.viewCount}</span>
                    <span className="gradient-text font-medium">
                      スコア: {entry.score}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-komapara-muted">
          <p>まだランキングデータがありません</p>
          <p className="text-sm mt-1">毎週月曜日に集計されます</p>
        </div>
      )}
    </div>
  );
}
