import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, slug, emoji } = body;

    const data: Record<string, string> = {};
    if (typeof name === "string") data.name = name;
    if (typeof slug === "string") data.slug = slug;
    if (typeof emoji === "string") data.emoji = emoji;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "更新するフィールドを指定してください" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(tag);
  } catch (err) {
    console.error("PATCH /api/admin/tags/[id] error:", err);
    return NextResponse.json(
      { error: "タグの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      include: { _count: { select: { works: true } } },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "タグが見つかりません" },
        { status: 404 }
      );
    }

    if (tag._count.works > 0) {
      return NextResponse.json(
        {
          error: `このタグは${tag._count.works}件の作品に使用されているため削除できません`,
        },
        { status: 400 }
      );
    }

    await prisma.tag.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/tags/[id] error:", err);
    return NextResponse.json(
      { error: "タグの削除に失敗しました" },
      { status: 500 }
    );
  }
}
