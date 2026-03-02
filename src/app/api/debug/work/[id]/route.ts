import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const steps: Record<string, unknown> = {};

  // Step 1: auth
  try {
    const session = await auth();
    steps.auth = { ok: true, userId: session?.user?.id || null };
  } catch (e: unknown) {
    const err = e as Error;
    steps.auth = { ok: false, error: err.message, stack: err.stack?.slice(0, 500) };
  }

  // Step 2: find work
  try {
    const work = await prisma.work.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, xHandle: true } },
        tags: { select: { name: true, slug: true, emoji: true } },
        comments: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        _count: { select: { comments: true } },
      },
    });
    steps.work = { ok: true, found: !!work, title: work?.title };
  } catch (e: unknown) {
    const err = e as Error;
    steps.work = { ok: false, error: err.message, stack: err.stack?.slice(0, 500) };
  }

  // Step 3: reactionGroups
  try {
    const reactionGroups = await prisma.like.groupBy({
      by: ["reaction"],
      where: { workId: params.id },
      _count: true,
    });
    steps.reactions = { ok: true, count: reactionGroups.length };
  } catch (e: unknown) {
    const err = e as Error;
    steps.reactions = { ok: false, error: err.message };
  }

  // Step 4: tipSetting
  try {
    const tipSetting = await prisma.siteSetting.findUnique({ where: { key: "tips_enabled" } });
    steps.tipSetting = { ok: true, value: tipSetting?.value };
  } catch (e: unknown) {
    const err = e as Error;
    steps.tipSetting = { ok: false, error: err.message };
  }

  return NextResponse.json(steps);
}
