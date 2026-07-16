import { NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getMedia, imageUrlsFromMedia } from "@/lib/instagram";

// 連携中ユーザーの投稿一覧（画像を含むものだけ・サムネと枚数）
export async function GET() {
  const { error, session } = await requireUser();
  if (error) return error;

  const acc = await prisma.instagramAccount.findUnique({
    where: { userId: session.user.id },
  });
  if (!acc) {
    return NextResponse.json({ error: "Instagram未連携です" }, { status: 400 });
  }

  const media = await getMedia(acc.accessToken, 120);
  const items = media
    .map((m) => ({
      id: m.id,
      caption: m.caption ?? "",
      permalink: m.permalink ?? "",
      thumbnail: m.thumbnail_url || m.media_url || "",
      type: m.media_type,
      count: imageUrlsFromMedia(m).length,
    }))
    .filter((m) => m.count > 0);

  return NextResponse.json({ items });
}
