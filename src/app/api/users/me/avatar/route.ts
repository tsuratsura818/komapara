import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/admin";
import { putImage } from "@/lib/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const { error, session } = await requireUser();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "JPEG、PNG、WebPのみ対応しています" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ファイルサイズは5MB以下にしてください" }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    // アイコンは円形で表示するため、ここだけは正方形に切り出す（400pxで retina 相当）
    const processed = await sharp(input)
      .resize(400, 400, { fit: "cover", position: "attention" })
      .webp({ quality: 88 })
      .toBuffer();

    const blob = await putImage(`avatars/${randomUUID()}.webp`, processed);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: blob.url },
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error("POST /api/users/me/avatar error:", err);
    return NextResponse.json({ error: "アイコンのアップロードに失敗しました" }, { status: 500 });
  }
}
