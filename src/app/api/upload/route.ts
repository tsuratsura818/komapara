import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { processImageToWebP, generateThumbnail } from "@/lib/image";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが必要です" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPEG、PNG、WebPのみ対応しています" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uuid = randomUUID();

    // WebP変換 + サムネイル生成
    const [processed, thumbnail] = await Promise.all([
      processImageToWebP(buffer, uuid),
      generateThumbnail(buffer, uuid),
    ]);

    await Promise.all([
      writeFile(path.join(uploadDir, processed.filename), processed.buffer),
      writeFile(path.join(uploadDir, thumbnail.filename), thumbnail.buffer),
    ]);

    const url = `/uploads/${processed.filename}`;
    const thumbUrl = `/uploads/${thumbnail.filename}`;

    return NextResponse.json(
      { url, thumbUrl, width: processed.width, height: processed.height },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
