import { prisma } from "@/lib/prisma";
import { WorkCard } from "@/components/works/WorkCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

// シリーズ一覧（公開・ユーザー個別状態なし）。ISRで配信
export const revalidate = 1800;

// 動的セグメントをオンデマンドISR化
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const series = await prisma.series.findUnique({
    where: { id: params.id },
    include: { author: { select: { name: true } } },
  });
  if (!series) return { title: "シリーズが見つかりません" };
  return {
    title: `${series.title} - ${series.author.name}`,
    description: series.description || `${series.author.name}の連載4コマ`,
  };
}

export default async function SeriesDetailPage(props: Props) {
  const params = await props.params;
  const series = await prisma.series.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      works: {
        where: { isPublished: true },
        orderBy: { seriesOrder: "asc" },
        include: {
          tags: { select: { name: true, slug: true, emoji: true } },
        },
      },
      _count: { select: { works: { where: { isPublished: true } } } },
    },
  });

  if (!series) notFound();

  const totalLikes = series.works.reduce((sum, w) => sum + w.likeCount, 0);
  const totalViews = series.works.reduce((sum, w) => sum + w.viewCount, 0);
  const coverImage = series.coverImage || series.works[0]?.panels[0];

  return (
    <div>
      {/* ヘッダー */}
      <div className="relative">
        {coverImage && (
          <div className="h-40 overflow-hidden">
            <img
              src={coverImage}
              alt={series.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-komapara-bg" />
          </div>
        )}
        {!coverImage && <div className="h-24 bg-gradient-main rounded-b-2xl" />}
      </div>

      <div className="px-4 -mt-8 relative">
        {/* シリーズ情報 */}
        <div className="glass rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            {series.isCompleted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                完結
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
              全{series._count.works}話
            </span>
          </div>

          <h1 className="text-xl font-bold text-komapara-text">
            {series.title}
          </h1>

          {series.description && (
            <p className="text-sm text-komapara-muted mt-1">
              {series.description}
            </p>
          )}

          {/* 作者 */}
          <Link
            href={`/creator/${series.author.id}`}
            className="flex items-center gap-2 mt-3"
          >
            {series.author.image ? (
              <img
                src={series.author.image}
                alt={series.author.name || ""}
                className="w-8 h-8 rounded-full ring-2 ring-purple-200/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-600 text-sm font-medium">
                {series.author.name?.[0] || "?"}
              </div>
            )}
            <span className="text-sm font-medium text-komapara-text">
              {series.author.name}
            </span>
          </Link>

          {/* 統計 */}
          <div className="flex gap-4 mt-3 text-xs text-komapara-muted">
            <span>
              <strong className="gradient-text">{totalLikes.toLocaleString()}</strong> いいね
            </span>
            <span>
              <strong className="gradient-text">{totalViews.toLocaleString()}</strong> 閲覧
            </span>
          </div>
        </div>

        {/* エピソード一覧 */}
        <h2 className="text-sm font-semibold gradient-text mb-3">
          エピソード
        </h2>

        <div className="space-y-2 mb-6">
          {series.works.map((work, index) => (
            <Link
              key={work.id}
              href={`/work/${work.id}`}
              className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-main flex items-center justify-center text-white text-xs font-bold">
                {index + 1}
              </div>
              <img
                src={work.panels[0]}
                alt={work.title}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-komapara-text truncate">
                  {work.title}
                </p>
                <div className="flex gap-3 text-[10px] text-komapara-muted mt-0.5">
                  <span>{work.likeCount} いいね</span>
                  <span>
                    {new Date(work.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-komapara-muted shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>

        {series.works.length === 0 && (
          <p className="text-center py-10 text-komapara-muted">
            まだエピソードがありません
          </p>
        )}

        {/* グリッド表示 */}
        {series.works.length > 0 && (
          <>
            <h2 className="text-sm font-semibold gradient-text mb-3">
              サムネイル一覧
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-6">
              {series.works.map((work) => (
                <WorkCard
                  key={work.id}
                  id={work.id}
                  title={work.title}
                  panels={work.panels}
                  author={series.author}
                  genres={work.tags}
                  likeCount={work.likeCount}
                  createdAt={work.createdAt.toISOString()}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
