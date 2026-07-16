import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

// 更新
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error } = await requireAdminApi();
  if (error) return error;

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
export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error } = await requireAdminApi();
  if (error) return error;

  await prisma.creatorOutreach.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
