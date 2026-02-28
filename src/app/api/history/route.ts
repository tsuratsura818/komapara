import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const history = await prisma.readHistory.findMany({
      where: { userId: session.user.id },
      include: {
        work: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            tags: { select: { name: true, slug: true, emoji: true } },
          },
        },
      },
      orderBy: { readAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("GET /api/history error:", error);
    return NextResponse.json(
      { error: "閲覧履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
