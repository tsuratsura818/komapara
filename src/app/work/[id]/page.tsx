import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkViewer } from "@/components/works/WorkViewer";
import { WorkCard } from "@/components/works/WorkCard";
import { SeriesNav } from "@/components/series/SeriesNav";
import { AdSlot } from "@/components/ui/AdSlot";
import { ReportButton } from "@/components/works/ReportButton";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const work = await prisma.work.findUnique({
    where: { id: params.id },
    include: { author: { select: { name: true } } },
  });

  if (!work) return { title: "作品が見つかりません" };

  return {
    title: work.title,
    description: `${work.author.name}の4コマ漫画`,
    openGraph: {
      title: `${work.title} - コマパラ`,
      description: `${work.author.name}の4コマ漫画`,
      images: [
        {
          url: `/api/og/work/${params.id}`,
          width: 1200,
          height: 630,
        },
        {
          url: `/api/og/work/${params.id}?format=square`,
          width: 1080,
          height: 1080,
        },
      ],
    },
    other: {
      "og:image:alt": `${work.title} - ${work.author.name}の4コマ漫画`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${work.title} - コマパラ`,
      description: `${work.author.name}の4コマ漫画`,
      images: [`/api/og/work/${params.id}`],
    },
  };
}

export default async function WorkDetailPage(props: Props) {
  const params = await props.params;
  const session = await auth();

  const work = await prisma.work.findUnique({
    where: { id: params.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          xHandle: true,
        },
      },
      tags: { select: { name: true, slug: true, emoji: true } },
      comments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: { select: { comments: true } },
    },
  });

  if (!work) notFound();

  // 閲覧カウント・閲覧履歴は WorkViewer マウント時のビーコン(/api/works/[id]/view)で計上する
  // （GET/描画中の副作用を避け、bot/プリフェッチでの過剰カウントを防ぐ）

  // いいね状態 + リアクション情報
  let userReaction: string | null = null;
  let isFollowingAuthor = false;

  if (session?.user?.id) {
    const [like, follow] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_workId: { userId: session.user.id, workId: work.id },
        },
        select: { reaction: true },
      }),
      session.user.id !== work.authorId
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: work.authorId,
              },
            },
          })
        : null,
    ]);
    userReaction = like?.reaction || null;
    isFollowingAuthor = !!follow;
  }

  // リアクション内訳
  const reactionGroups = await prisma.like.groupBy({
    by: ["reaction"],
    where: { workId: work.id },
    _count: true,
  });
  const reactionCounts: Record<string, number> = {};
  for (const g of reactionGroups) {
    reactionCounts[g.reaction] = g._count;
  }

  // 投げ銭機能の有効/無効
  const tipSetting = await prisma.siteSetting.findUnique({ where: { key: "tips_enabled" } }).catch(() => null);
  const tipsEnabled = tipSetting?.value !== "false";

  // プレミアム状態
  let isPremium = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, premiumExpiry: true },
    });
    isPremium = !!(user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date());
  }

  // シリーズ前後ナビ
  let seriesNav = null as {
    series: { id: string; title: string };
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
    currentEpisode: number;
    totalEpisodes: number;
  } | null;
  if (work.seriesId) {
    const [series, seriesWorks] = await Promise.all([
      prisma.series.findUnique({
        where: { id: work.seriesId },
        select: { id: true, title: true },
      }),
      prisma.work.findMany({
        where: { seriesId: work.seriesId, isPublished: true },
        orderBy: { seriesOrder: "asc" },
        select: { id: true, title: true, seriesOrder: true },
      }),
    ]);
    if (series) {
      const currentIdx = seriesWorks.findIndex((w) => w.id === work.id);
      seriesNav = {
        series,
        prev: currentIdx > 0 ? seriesWorks[currentIdx - 1] : null,
        next: currentIdx < seriesWorks.length - 1 ? seriesWorks[currentIdx + 1] : null,
        currentEpisode: currentIdx + 1,
        totalEpisodes: seriesWorks.length,
      };
    }
  }

  // 作品詳細ページ用広告
  const now = new Date();
  const workAds = await prisma.advertisement.findMany({
    where: {
      isActive: true,
      placement: { in: ["work", "all"] },
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { sortOrder: "desc" },
    select: { id: true, company: true, imageUrl: true, linkUrl: true, description: true },
    take: 1,
  });
  const workAd = workAds[0] ?? null;

  // 関連作品（同ジャンル）
  const tagSlugs = work.tags.map((t) => t.slug);
  const relatedWorks = tagSlugs.length
    ? await prisma.work.findMany({
        where: {
          id: { not: work.id },
          isPublished: true,
          tags: { some: { slug: { in: tagSlugs } } },
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: { select: { name: true, slug: true, emoji: true } },
        },
        orderBy: { likeCount: "desc" },
        take: 6,
      })
    : [];

  const workData = {
    id: work.id,
    title: work.title,
    description: work.description,
    panels: work.panels,
    author: work.author,
    genres: work.tags,
    likeCount: work.likeCount,
    viewCount: work.viewCount,
    commentCount: work._count.comments,
    xPostUrl: work.xPostUrl,
    createdAt: work.createdAt.toISOString(),
    userReaction,
    reactionCounts,
    isFollowingAuthor,
    comments: work.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  const isOwnWork = session?.user?.id === work.authorId;

  return (
    <div>
      <WorkViewer work={workData} tipsEnabled={tipsEnabled} isPremium={isPremium} />

      {/* 通報ボタン（自分の作品以外・ログイン時） */}
      {session?.user?.id && !isOwnWork && (
        <div className="px-4 flex justify-end">
          <ReportButton workId={work.id} />
        </div>
      )}

      {/* 広告（シリーズナビの前） */}
      <div className="px-4 pt-4">
        <AdSlot isPremium={isPremium} ad={workAd} slot="work-detail" />
      </div>

      {/* シリーズナビ */}
      {seriesNav && <SeriesNav nav={seriesNav} />}

      {/* 関連作品 */}
      {relatedWorks.length > 0 && (
        <div className="px-4 py-6 border-t border-komapara-border">
          <h2 className="text-sm font-semibold text-komapara-text mb-3">
            関連作品
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {relatedWorks.map((rw) => (
              <WorkCard
                key={rw.id}
                id={rw.id}
                title={rw.title}
                panels={rw.panels}
                author={rw.author}
                genres={rw.tags}
                likeCount={rw.likeCount}
                createdAt={rw.createdAt.toISOString()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
