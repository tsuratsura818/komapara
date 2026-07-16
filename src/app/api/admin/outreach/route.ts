import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

// 一覧取得
export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const genre = searchParams.get("genre");

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (genre) where.genre = genre;

  const items = await prisma.creatorOutreach.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(items);
}

// 新規追加
export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const { xHandle, name, genre, followers, note } = body as {
    xHandle: string;
    name: string;
    genre: string;
    followers?: number;
    note?: string;
  };

  if (!xHandle?.trim() || !name?.trim() || !genre?.trim()) {
    return NextResponse.json(
      { error: "Xハンドル・名前・ジャンルは必須です" },
      { status: 400 }
    );
  }

  const handle = xHandle.trim().replace(/^@/, "");

  try {
    const item = await prisma.creatorOutreach.create({
      data: {
        xHandle: handle,
        name: name.trim(),
        genre: genre.trim(),
        followers: followers || 0,
        note: note?.trim() || null,
      },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "このハンドルは既に登録されています" },
      { status: 409 }
    );
  }
}
