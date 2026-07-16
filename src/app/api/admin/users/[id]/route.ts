import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error, session } = await requireAdminApi();
  if (error) return error;

  try {
    const { id } = params;
    const body = await request.json();
    const { isBanned } = body;

    if (typeof isBanned !== "boolean") {
      return NextResponse.json(
        { error: "isBanned は boolean で指定してください" },
        { status: 400 }
      );
    }

    // 自分自身のBAN防止
    if (id === session?.user?.id) {
      return NextResponse.json(
        { error: "自分自身をBANすることはできません" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isBanned },
      select: { id: true, name: true, isBanned: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json(
      { error: "ユーザーの更新に失敗しました" },
      { status: 500 }
    );
  }
}
