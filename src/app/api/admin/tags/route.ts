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

    if (name.length > 50 || slug.length > 50 || (emoji && emoji.length > 10)) {
      return NextResponse.json(
        { error: "name/slugは50文字以内、emojiは10文字以内で入力してください" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "slugは半角英数字とハイフンのみ使用できます" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: { name: name.slice(0, 50), slug: slug.slice(0, 50), emoji: (emoji || "").slice(0, 10) },
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
