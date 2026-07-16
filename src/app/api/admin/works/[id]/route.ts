import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await request.json();
    const { isPublished, isPickup } = body;

    if (typeof isPublished !== "boolean" && typeof isPickup !== "boolean") {
      return NextResponse.json(
        { error: "isPublished か isPickup を boolean で指定してください" },
        { status: 400 }
      );
    }

    // 「今週のピックアップ」は常に1作品だけ。立てる時は他を全て下ろす
    if (isPickup === true) {
      const [, work] = await prisma.$transaction([
        prisma.work.updateMany({
          where: { isPickup: true, NOT: { id: params.id } },
          data: { isPickup: false },
        }),
        prisma.work.update({
          where: { id: params.id },
          data: { isPickup: true },
          select: { id: true, title: true, isPublished: true, isPickup: true },
        }),
      ]);
      revalidatePath("/");
      return NextResponse.json(work);
    }

    const work = await prisma.work.update({
      where: { id: params.id },
      data: {
        ...(typeof isPublished === "boolean" ? { isPublished } : {}),
        ...(typeof isPickup === "boolean" ? { isPickup } : {}),
      },
      select: { id: true, title: true, isPublished: true, isPickup: true },
    });

    revalidatePath("/");
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
