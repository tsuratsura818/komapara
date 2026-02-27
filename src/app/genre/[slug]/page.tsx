import { prisma } from "@/lib/prisma";
import { WorkCard } from "@/components/works/WorkCard";
import { GENRES } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const genre = GENRES.find((g) => g.slug === params.slug);
  if (!genre) return { title: "ジャンルが見つかりません" };
  return { title: `${genre.emoji} ${genre.name}の4コマ` };
}

export default async function GenrePage({ params }: Props) {
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
    <div className="px-4 py-6">
      {/* ジャンルヘッダー */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-komapara-text">
          {genre.emoji} {genre.name}
        </h1>
        <p className="text-sm text-komapara-muted mt-1">
          {works.length}件の作品
        </p>
      </div>

      {/* ジャンルタブ */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
        {GENRES.map((g) => (
          <Link
            key={g.slug}
            href={`/genre/${g.slug}`}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              g.slug === params.slug
                ? "bg-primary-500 text-white"
                : "bg-komapara-tag text-komapara-tag-text hover:bg-primary-100"
            }`}
          >
            {g.emoji} {g.name}
          </Link>
        ))}
      </div>

      {/* 作品グリッド */}
      {works.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {works.map((work) => (
            <WorkCard
              key={work.id}
              id={work.id}
              title={work.title}
              panels={work.panels}
              author={work.author}
              genres={work.tags}
              likeCount={work.likeCount}
              createdAt={work.createdAt.toISOString()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-komapara-muted">
          <p>このジャンルにはまだ作品がありません</p>
        </div>
      )}
    </div>
  );
}
