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

  // スコア = いいね×2 + 閲覧数。DB側でスコア順に上位20件を取得する。
  // （likeCountで事前に絞ると、高PV・低いいねの作品がランキングから漏れるため）
  const rows = await prisma.$queryRaw<Array<{ id: string; score: number | bigint }>>`
    SELECT "id", ("likeCount" * 2 + "viewCount") AS score
    FROM "Work"
    WHERE "isPublished" = true AND "createdAt" >= ${sevenDaysAgo}
    ORDER BY score DESC
    LIMIT 20
  `;

  const scored = rows.map((r, i) => ({
    workId: r.id,
    score: Number(r.score),
    rank: i + 1,
  }));

  // 既存週の削除と再作成を原子的に（途中失敗で週が中途半端に壊れないように）
  await prisma.$transaction([
    prisma.weeklyRanking.deleteMany({ where: { weekStart } }),
    prisma.weeklyRanking.createMany({
      data: scored.map((s) => ({
        workId: s.workId,
        score: s.score,
        rank: s.rank,
        weekStart,
      })),
    }),
  ]);

  return scored.map((s) => ({ workId: s.workId, score: s.score }));
}
