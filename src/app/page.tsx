import { WorkFeed } from "@/components/works/WorkFeed";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 60;

export default async function HomePage() {
  const [works, totalCount] = await Promise.all([
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
      <section className="relative overflow-hidden bg-gradient-main px-4 py-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">
            4コマの世界を、もっと楽しく
          </h1>
          <p className="text-white/80 text-sm mt-2">
            お気に入りの4コマ漫画を見つけて、作家をフォローしよう
          </p>
          <Link
            href="/about"
            className="inline-block mt-3 px-4 py-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            コマパラについて
          </Link>
        </div>
        {/* Decorative elements (static, no animation) */}
        <div className="absolute top-2 right-4 w-16 h-16 bg-white/10 rounded-lg rotate-12" />
        <div className="absolute bottom-2 right-16 w-12 h-12 bg-white/10 rounded-lg -rotate-6" />
        <div className="absolute top-4 right-36 w-8 h-8 bg-white/5 rounded-lg rotate-45" />
      </section>
      <WorkFeed
        initialWorks={initialWorks}
        initialTotalPages={Math.ceil(totalCount / 20)}
      />
    </>
  );
}
