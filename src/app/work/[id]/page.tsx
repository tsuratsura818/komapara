import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkViewer } from "@/components/works/WorkViewer";
import { WorkCard } from "@/components/works/WorkCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${work.title} - コマパラ`,
      description: `${work.author.name}の4コマ漫画`,
      images: [`/api/og/work/${params.id}`],
    },
  };
}

export default async function WorkDetailPage({ params }: Props) {
  const session = await auth();

  const work = await prisma.work.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
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

  // いいね状態
  let isLiked = false;
  let isFollowingAuthor = false;

  if (session?.user?.id) {
    const [like, follow] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_workId: { userId: session.user.id, workId: work.id },
        },
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
    isLiked = !!like;
    isFollowingAuthor = !!follow;
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
    isLiked,
    isFollowingAuthor,
    comments: work.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return (
    <div>
      <WorkViewer work={workData} tipsEnabled={tipsEnabled} isPremium={isPremium} />

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
