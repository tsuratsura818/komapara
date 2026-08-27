import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "nishikawa@tsuratsura.com";

async function main() {
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });
  console.log(`全ユーザー数: ${allUsers.length}`);
  allUsers.forEach((u) => console.log(`  - ${u.name} (${u.email}) [${u.id}]`));

  const nonAdminUsers = allUsers.filter((u) => u.email !== ADMIN_EMAIL);
  console.log(`\nadmin以外: ${nonAdminUsers.length}件`);

  if (nonAdminUsers.length === 0) {
    console.log("削除対象なし");
    return;
  }

  const nonAdminIds = nonAdminUsers.map((u) => u.id);

  // 関連データカウント
  const worksCount = await prisma.work.count({ where: { authorId: { in: nonAdminIds } } });
  const commentsCount = await prisma.comment.count({ where: { userId: { in: nonAdminIds } } });
  const likesCount = await prisma.like.count({ where: { userId: { in: nonAdminIds } } });
  const followsCount = await prisma.follow.count({
    where: { OR: [{ followerId: { in: nonAdminIds } }, { followingId: { in: nonAdminIds } }] },
  });

  console.log(`\n削除予定:`);
  console.log(`  作品: ${worksCount}`);
  console.log(`  コメント: ${commentsCount}`);
  console.log(`  いいね: ${likesCount}`);
  console.log(`  フォロー: ${followsCount}`);
  console.log(`  ユーザー: ${nonAdminUsers.length}`);

  // 非adminユーザーの作品IDを取得
  const workIds = (await prisma.work.findMany({
    where: { authorId: { in: nonAdminIds } },
    select: { id: true },
  })).map((w) => w.id);

  if (workIds.length > 0) {
    // 作品に紐づくデータ（全ユーザーからのもの含む）
    await prisma.like.deleteMany({ where: { workId: { in: workIds } } });
    await prisma.comment.deleteMany({ where: { workId: { in: workIds } } });
    await prisma.report.deleteMany({ where: { workId: { in: workIds } } });
    await prisma.readHistory.deleteMany({ where: { workId: { in: workIds } } });
    await prisma.weeklyRanking.deleteMany({ where: { workId: { in: workIds } } });
  }

  // 非adminユーザーが他の作品に行ったアクション
  await prisma.like.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.comment.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.report.deleteMany({ where: { reporterId: { in: nonAdminIds } } });
  await prisma.readHistory.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.pushSubscription.deleteMany({ where: { userId: { in: nonAdminIds } } });

  // フォロー
  await prisma.follow.deleteMany({
    where: { OR: [{ followerId: { in: nonAdminIds } }, { followingId: { in: nonAdminIds } }] },
  });

  await prisma.premiumSubscription.deleteMany({ where: { userId: { in: nonAdminIds } } });

  // 作品
  await prisma.work.deleteMany({ where: { authorId: { in: nonAdminIds } } });

  // シリーズ
  await prisma.series.deleteMany({ where: { authorId: { in: nonAdminIds } } });

  // セッション・アカウント
  await prisma.session.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prisma.account.deleteMany({ where: { userId: { in: nonAdminIds } } });

  // ユーザー削除
  const deleted = await prisma.user.deleteMany({ where: { id: { in: nonAdminIds } } });
  console.log(`\n✅ ${deleted.count}件のユーザーと関連データを削除しました`);

  const remaining = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  console.log(`\n残りのユーザー: ${remaining.length}件`);
  remaining.forEach((u) => console.log(`  - ${u.name} (${u.email})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
