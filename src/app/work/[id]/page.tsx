import { prisma } from "@/lib/prisma";
import { WorkViewer } from "@/components/works/WorkViewer";
import { WorkCard } from "@/components/works/WorkCard";
import { SeriesNav } from "@/components/series/SeriesNav";
import { AdSlot } from "@/components/ui/AdSlot";
import { notFound } from "next/navigation";
import { cleanCaptionForShare } from "@/lib/utils";
import type { Metadata } from "next";

// 公開の作品詳細（ユーザー個別状態はクライアントが自己フェッチ）。ISRで配信
export const revalidate = 300;

// 動的セグメントをオンデマンドISR化（初回リクエストで生成しrevalidate秒キャッシュ）
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const work = await prisma.work.findUnique({
    where: { id: params.id },
    include: { author: { select: { name: true } } },
  });

  if (!work) return { title: "作品が見つかりません" };

  // 投稿時の説明文をシェア文面に使う。ハッシュタグ・誘導文の定型は除去し、
  // 実質的な説明が残らなければ作家名で補完する（カードがタグ羅列になるのを防ぐ）
  const cleaned = cleanCaptionForShare(work.description);
  const shareDescription =
    cleaned.length >= 10 ? cleaned.slice(0, 110) : `${work.author.name}の4コマ漫画`;

  return {
    title: work.title,
    description: shareDescription,
    openGraph: {
      title: `${work.title} - コマパラ`,
      description: shareDescription,
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
      description: shareDescription,
      images: [`/api/og/work/${params.id}`],
    },
  };
}

export default async function WorkDetailPage(props: Props) {
  const params = await props.params;

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

  // 閲覧カウント・閲覧履歴は WorkViewer マウント時のビーコン(/api/works/[id]/view)で計上する。
  // 自分のリアクション/フォロー状態は WorkViewer が /api/works/[id]/me から自己取得するため、
  // ここ（共有キャッシュされるサーバー描画）では個別状態を一切持たない。

  // リアクション内訳（公開情報）
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
        take: 4,
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
    // 個別状態はクライアントが /api/works/[id]/me から取得（ISR共有キャッシュのため既定値）
    userReaction: null,
    reactionCounts,
    isFollowingAuthor: false,
    comments: work.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return (
    <div>
      {/* 読書面の外側に敷く柄。main が max-w-7xl で幅を持てないため、
          fixed で画面全体の背面に敷き、白い誌面をその上に乗せる */}
      <div className="fixed inset-0 -z-10 reading-bg" aria-hidden="true" />

      {/* 誌面。柄の地から1枚の紙として浮かせる。ブロックを分けると継ぎ目に
          影の線が出るため、読む部分から広告・シリーズナビまでを1枚に収める */}
      <div className="max-w-2xl mx-auto bg-white pb-2 sm:mt-5 sm:rounded-2xl sm:shadow-[0_2px_28px_rgba(15,23,42,0.13)] sm:ring-1 sm:ring-black/5">
        {/* 通報ボタンは WorkViewer 内でクライアント判定して表示 */}
        <WorkViewer work={workData} tipsEnabled={tipsEnabled} />

        {/* 広告（シリーズナビの前）。プレミアム非表示はAdSlotがセッションで判定 */}
        <div className="px-4 pt-4">
          <AdSlot ad={workAd} slot="work-detail" />
        </div>

        {/* シリーズナビ */}
        {seriesNav && <SeriesNav nav={seriesNav} />}
      </div>

      {/* 関連作品 */}
      {relatedWorks.length > 0 && (
        <div className="px-4 py-6 border-t border-komapara-border">
          <h2 className="text-sm font-semibold text-komapara-text mb-3">
            関連作品
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
