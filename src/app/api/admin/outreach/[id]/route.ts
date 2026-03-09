import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return null;
  }
  return session;
}

// 更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const { status, note, followers, dmSentAt, repliedAt } = body as {
    status?: string;
    note?: string;
    followers?: number;
    dmSentAt?: string | null;
    repliedAt?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (note !== undefined) data.note = note;
  if (followers !== undefined) data.followers = followers;
  if (dmSentAt !== undefined) data.dmSentAt = dmSentAt ? new Date(dmSentAt) : null;
  if (repliedAt !== undefined) data.repliedAt = repliedAt ? new Date(repliedAt) : null;

  const item = await prisma.creatorOutreach.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(item);
}

// 削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  await prisma.creatorOutreach.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
