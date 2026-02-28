import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: { id: string } };

// シリーズ詳細
export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const series = await prisma.series.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        works: {
          where: { isPublished: true },
          orderBy: { seriesOrder: "asc" },
          include: {
            tags: { select: { name: true, slug: true, emoji: true } },
          },
        },
        _count: { select: { works: { where: { isPublished: true } } } },
      },
    });

    if (!series) {
      return NextResponse.json(
        { error: "シリーズが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...series,
      coverImage: series.coverImage || series.works[0]?.panels[0] || null,
      episodeCount: series._count.works,
    });
  } catch (error) {
    console.error("GET /api/series/[id] error:", error);
    return NextResponse.json(
      { error: "シリーズの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// シリーズ更新
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const existing = await prisma.series.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "シリーズが見つかりません" }, { status: 404 });
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (!body.title?.trim()) {
        return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
      }
      data.title = body.title.trim().slice(0, 50);
    }
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.isCompleted !== undefined) data.isCompleted = !!body.isCompleted;

    // 作品の並び替え
    if (body.workOrder && Array.isArray(body.workOrder)) {
      await Promise.all(
        body.workOrder.map((workId: string, index: number) =>
          prisma.work.update({
            where: { id: workId },
            data: { seriesOrder: index + 1 },
          })
        )
      );
    }

    // 作品をシリーズに追加
    if (body.addWorkId) {
      const maxOrder = await prisma.work.aggregate({
        where: { seriesId: params.id },
        _max: { seriesOrder: true },
      });
      await prisma.work.update({
        where: { id: body.addWorkId },
        data: {
          seriesId: params.id,
          seriesOrder: (maxOrder._max.seriesOrder || 0) + 1,
        },
      });
    }

    // 作品をシリーズから除外
    if (body.removeWorkId) {
      await prisma.work.update({
        where: { id: body.removeWorkId },
        data: { seriesId: null, seriesOrder: null },
      });
    }

    const series = await prisma.series.update({
      where: { id: params.id },
      data,
      include: {
        author: { select: { id: true, name: true, image: true } },
        works: {
          orderBy: { seriesOrder: "asc" },
          select: { id: true, title: true, panels: true, seriesOrder: true },
        },
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error("PATCH /api/series/[id] error:", error);
    return NextResponse.json(
      { error: "シリーズの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// シリーズ削除
export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const existing = await prisma.series.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "シリーズが見つかりません" }, { status: 404 });
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // 作品のシリーズ紐付けを解除してからシリーズ削除
    await prisma.work.updateMany({
      where: { seriesId: params.id },
      data: { seriesId: null, seriesOrder: null },
    });

    await prisma.series.delete({ where: { id: params.id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/series/[id] error:", error);
    return NextResponse.json(
      { error: "シリーズの削除に失敗しました" },
      { status: 500 }
    );
  }
}
