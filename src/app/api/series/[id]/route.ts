import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

// シリーズ詳細
export async function GET(_request: NextRequest, props: Props) {
  const params = await props.params;
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
export async function PATCH(request: NextRequest, props: Props) {
  const params = await props.params;
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

    // シリーズの所有者チェックだけでは不十分。操作対象の作品が自分のものかを
    // 必ず確認する。抜けていると、他人の作品を自分のシリーズに取り込んだり、
    // 他人の連載から作品を外して破壊したりできてしまう。
    const ownsWork = async (workId: string) => {
      const w = await prisma.work.findUnique({
        where: { id: workId },
        select: { authorId: true },
      });
      return w?.authorId === session.user!.id;
    };

    // 作品の並び替え
    if (body.workOrder && Array.isArray(body.workOrder)) {
      const workIds: string[] = body.workOrder.filter((v: unknown) => typeof v === "string");
      const owned = await prisma.work.findMany({
        where: { id: { in: workIds }, authorId: session.user.id },
        select: { id: true },
      });
      if (owned.length !== workIds.length) {
        return NextResponse.json({ error: "権限がありません" }, { status: 403 });
      }
      await Promise.all(
        workIds.map((workId, index) =>
          prisma.work.update({
            where: { id: workId },
            data: { seriesOrder: index + 1 },
          })
        )
      );
    }

    // 作品をシリーズに追加
    if (body.addWorkId) {
      if (typeof body.addWorkId !== "string" || !(await ownsWork(body.addWorkId))) {
        return NextResponse.json({ error: "権限がありません" }, { status: 403 });
      }
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
      if (typeof body.removeWorkId !== "string" || !(await ownsWork(body.removeWorkId))) {
        return NextResponse.json({ error: "権限がありません" }, { status: 403 });
      }
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
export async function DELETE(_request: NextRequest, props: Props) {
  const params = await props.params;
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
