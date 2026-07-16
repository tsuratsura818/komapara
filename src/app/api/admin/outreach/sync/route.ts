import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

// CreatorOutreach と登録済みユーザーのxHandleを突合して自動更新
export async function POST() {
  const { error } = await requireAdminApi();
  if (error) return error;

  // まだ「登録済み」でないOutreachのxHandleを取得
  const pendingOutreach = await prisma.creatorOutreach.findMany({
    where: { status: { notIn: ["登録済み", "見送り"] } },
    select: { id: true, xHandle: true },
  });

  if (pendingOutreach.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  // 登録済みユーザーのxHandleを取得
  const users = await prisma.user.findMany({
    where: { xHandle: { not: null } },
    select: { xHandle: true },
  });
  const registeredHandles = new Set(
    users.map((u) => u.xHandle?.replace(/^@/, "").toLowerCase())
  );

  // 突合して更新
  const toUpdate = pendingOutreach.filter((o) =>
    registeredHandles.has(o.xHandle.toLowerCase())
  );

  if (toUpdate.length > 0) {
    await prisma.creatorOutreach.updateMany({
      where: { id: { in: toUpdate.map((o) => o.id) } },
      data: { status: "登録済み" },
    });
  }

  return NextResponse.json({ updated: toUpdate.length, checked: pendingOutreach.length });
}
