import { prisma } from "./prisma";

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function calculateWeeklyRanking() {
  const weekStart = getWeekStart();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 直近7日間の作品をスコア順に取得
  const works = await prisma.work.findMany({
    where: {
      isPublished: true,
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      id: true,
      likeCount: true,
      viewCount: true,
    },
    orderBy: { likeCount: "desc" },
    take: 100,
  });

  // スコア計算: いいね × 2 + 閲覧数
  const scored = works
    .map((work) => ({
      workId: work.id,
      score: work.likeCount * 2 + work.viewCount,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // 既存のランキングを削除して再作成
  await prisma.weeklyRanking.deleteMany({
    where: { weekStart },
  });

  for (let i = 0; i < scored.length; i++) {
    await prisma.weeklyRanking.create({
      data: {
        workId: scored[i].workId,
        score: scored[i].score,
        rank: i + 1,
        weekStart,
      },
    });
  }

  return scored;
}
