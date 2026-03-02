import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { GENRES } from "@/lib/utils";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://komapara.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/ranking`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/search`, changeFrequency: "daily", priority: 0.6 },
  ];

  // ジャンル別ページ
  const genrePages: MetadataRoute.Sitemap = GENRES.map((genre) => ({
    url: `${BASE_URL}/genre/${genre.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // 公開中の全作品
  const works = await prisma.work.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const workPages: MetadataRoute.Sitemap = works.map((work) => ({
    url: `${BASE_URL}/work/${work.id}`,
    lastModified: work.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 作家ページ（isCreator のユーザー）
  const creators = await prisma.user.findMany({
    where: { isCreator: true },
    select: { id: true, updatedAt: true },
  });

  const creatorPages: MetadataRoute.Sitemap = creators.map((creator) => ({
    url: `${BASE_URL}/creator/${creator.id}`,
    lastModified: creator.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...genrePages, ...workPages, ...creatorPages];
}
