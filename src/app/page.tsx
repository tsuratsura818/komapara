import { WorkFeed } from "@/components/works/WorkFeed";
import { prisma } from "@/lib/prisma";

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

  // ヒーローは置かない。読者の仕事は「読む」こと。開いた瞬間に4コマが並ぶ（§6 跡地は余白）
  return (
    <WorkFeed
      initialWorks={initialWorks}
      initialTotalPages={Math.ceil(totalCount / 20)}
      feedAds={adsResult}
    />
  );
}
