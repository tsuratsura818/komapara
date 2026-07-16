import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await request.json();
    const { isPublished } = body;

    if (typeof isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished は boolean で指定してください" },
        { status: 400 }
      );
    }

    const work = await prisma.work.update({
      where: { id: params.id },
      data: { isPublished },
      select: { id: true, title: true, isPublished: true },
    });

    return NextResponse.json(work);
  } catch (err) {
    console.error("PATCH /api/admin/works/[id] error:", err);
    return NextResponse.json(
      { error: "作品の更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    await prisma.work.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/works/[id] error:", err);
    return NextResponse.json(
      { error: "作品の削除に失敗しました" },
      { status: 500 }
    );
  }
}
