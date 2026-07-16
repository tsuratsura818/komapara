import { prisma } from "@/lib/prisma";
import { WorkCard } from "@/components/works/WorkCard";
import { GENRES } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// 公開のジャンル一覧（ユーザー個別状態なし）。ISRで配信しDB負荷を抑える
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const genre = GENRES.find((g) => g.slug === params.slug);
  if (!genre) return { title: "ジャンルが見つかりません" };
  return { title: `${genre.emoji} ${genre.name}の4コマ` };
}

export default async function GenrePage(props: Props) {
  const params = await props.params;
  const genre = GENRES.find((g) => g.slug === params.slug);
  if (!genre) notFound();

  const works = await prisma.work.findMany({
    where: {
      isPublished: true,
      tags: { some: { slug: params.slug } },
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      tags: { select: { name: true, slug: true, emoji: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      {/* ジャンルヘッダー */}
      <div className="bg-gradient-main px-4 py-5 text-white rounded-b-2xl">
        <h1 className="text-xl font-bold">
          {genre.emoji} {genre.name}
        </h1>
        <p className="text-white/80 text-sm mt-1">{works.length}件の作品</p>
      </div>

      <div className="px-4 py-4">
        {/* ジャンルタブ */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
          {GENRES.map((g) => (
            <Link
              key={g.slug}
              href={`/genre/${g.slug}`}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                g.slug === params.slug
                  ? "bg-gradient-main text-white shadow-sm"
                  : "glass text-komapara-muted hover:text-komapara-text"
              }`}
            >
              {g.emoji} {g.name}
            </Link>
          ))}
        </div>

        {/* 作品グリッド */}
        {works.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {works.map((work) => (
              <div
                key={work.id}
              >
                <WorkCard
                  id={work.id}
                  title={work.title}
                  panels={work.panels}
                  author={work.author}
                  genres={work.tags}
                  likeCount={work.likeCount}
                  createdAt={work.createdAt.toISOString()}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-komapara-muted">
            <p>このジャンルにはまだ作品がありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
