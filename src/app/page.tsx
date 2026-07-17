import { WorkFeed } from "@/components/works/WorkFeed";
import { WeeklyPickup } from "@/components/works/WeeklyPickup";
import { CreatorMarquee } from "@/components/creator/CreatorMarquee";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function HomePage() {
  const now = new Date();
  const [works, totalCount, adsResult, pickup, creators] = await Promise.all([
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
    // 今週のピックアップ（管理画面で1作品だけ立てる。未設定なら出さない）
    prisma.work.findFirst({
      where: { isPickup: true, isPublished: true },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { select: { name: true, slug: true, emoji: true } },
      },
    }),
    // 参加作家（公開作品を持つ人のみ。作品数の多い順）
    prisma.user.findMany({
      where: { works: { some: { isPublished: true } } },
      select: {
        id: true,
        name: true,
        image: true,
        _count: { select: { works: { where: { isPublished: true } } } },
      },
      orderBy: { works: { _count: "desc" } },
      take: 30,
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

  // 巨大ヒーローは置かない。読者の仕事は「読む」こと（§6 跡地は余白）。
  // ピックアップは編集判断の1作品のみ、4コマ自体を見せる形で最小限に。
  return (
    <>
      {pickup && <WeeklyPickup work={pickup} />}
      <WorkFeed
        initialWorks={initialWorks}
        initialTotalPages={Math.ceil(totalCount / 20)}
        feedAds={adsResult}
      />

      {/* 参加作家。作品の下に置く＝読んだあとに「誰が描いたか」へ回遊させる */}
      {creators.length > 0 && (
        <section className="px-4 pt-2 pb-8">
          <SectionHeading>参加作家</SectionHeading>
          <CreatorMarquee
            creators={creators.map((c) => ({
              id: c.id,
              name: c.name,
              image: c.image,
              workCount: c._count.works,
            }))}
          />
        </section>
      )}
    </>
  );
}
