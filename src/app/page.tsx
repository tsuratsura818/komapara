import { WorkFeed } from "@/components/works/WorkFeed";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 60;

export default async function HomePage() {
  const now = new Date();
  const [works, totalCount, adsResult] = await Promise.all([
    prisma.work.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { select: { name: true, slug: true, emoji: true } },
      },
    }),
    prisma.work.count({ where: { isPublished: true } }),
    prisma.advertisement.findMany({
      where: {
        isActive: true,
        placement: { in: ["feed", "all"] },
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { sortOrder: "desc" },
      select: { id: true, company: true, imageUrl: true, linkUrl: true, description: true },
    }),
  ]);

  const initialWorks = works.map((work) => ({
    id: work.id,
    title: work.title,
    panels: work.panels,
    author: work.author,
    genres: work.tags,
    likeCount: work.likeCount,
    viewCount: work.viewCount,
    createdAt: work.createdAt.toISOString(),
    isLiked: false,
  }));

  return (
    <>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100/80 px-4 py-9">
        {/* Aurora background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_50%,rgba(139,92,246,0.07),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(59,130,246,0.05),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(236,72,153,0.04),transparent)]" />
        </div>
        <div className="relative max-w-lg mx-auto text-center">
          <div className="badge-glass inline-flex items-center gap-1.5 mb-4 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            4コマ漫画に特化したポータルサイト
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 leading-tight">
            4コマの世界を、<br />
            <span className="gradient-text">もっと楽しく。</span>
          </h1>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed">
            笑える、泣ける、共感できる。<br className="sm:hidden" />
            お気に入りの4コマ漫画を見つけよう。
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Link
              href="/upload"
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-main rounded-xl shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-px transition-all duration-200"
            >
              + 投稿する
            </Link>
            <Link
              href="/about"
              className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
            >
              コマパラとは？
            </Link>
          </div>
        </div>
      </section>
      <WorkFeed
        initialWorks={initialWorks}
        initialTotalPages={Math.ceil(totalCount / 20)}
        feedAds={adsResult}
      />
    </>
  );
}
