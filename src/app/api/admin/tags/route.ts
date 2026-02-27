import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { works: true } } },
    });
    return NextResponse.json(tags);
  } catch (err) {
    console.error("GET /api/admin/tags error:", err);
    return NextResponse.json(
      { error: "タグ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, slug, emoji } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name と slug は必須です" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: { name, slug, emoji: emoji || "" },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/tags error:", err);
    return NextResponse.json(
      { error: "タグの作成に失敗しました" },
      { status: 500 }
    );
  }
}
