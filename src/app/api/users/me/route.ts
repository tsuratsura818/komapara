import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/admin";

// SNSのハンドルは @ やURL形式で貼られがちなので、保存前に素のIDへ寄せる
function normalizeHandle(input: unknown, host: string): string | null {
  if (typeof input !== "string") return null;
  let v = input.trim();
  if (!v) return null;
  v = v.replace(new RegExp(`^https?://(www\\.)?${host}/`, "i"), "");
  v = v.replace(/^@/, "").split(/[/?]/)[0].trim();
  return v || null;
}

function normalizeUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim();
  if (!v) return null;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    // javascript: 等を弾く
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest) {
  const { error, session } = await requireUser();
  if (error) return error;

  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 30) : undefined;
    if (name !== undefined && name.length === 0) {
      return NextResponse.json({ error: "表示名を入力してください" }, { status: 400 });
    }

    const data = {
      ...(name !== undefined ? { name } : {}),
      ...(typeof body.bio === "string" ? { bio: body.bio.trim().slice(0, 200) || null } : {}),
      ...("xHandle" in body ? { xHandle: normalizeHandle(body.xHandle, "(x|twitter)\\.com") } : {}),
      ...("instagramHandle" in body
        ? { instagramHandle: normalizeHandle(body.instagramHandle, "instagram\\.com") }
        : {}),
      ...("websiteUrl" in body ? { websiteUrl: normalizeUrl(body.websiteUrl) } : {}),
      ...(typeof body.image === "string" && body.image ? { image: body.image } : {}),
    };

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        bio: true,
        image: true,
        xHandle: true,
        instagramHandle: true,
        websiteUrl: true,
      },
    });

    // 作家ページ(ISR)に即反映させる
    revalidatePath(`/creator/${session.user.id}`);
    revalidatePath("/");

    return NextResponse.json(user);
  } catch (err) {
    console.error("PATCH /api/users/me error:", err);
    return NextResponse.json({ error: "プロフィールの更新に失敗しました" }, { status: 500 });
  }
}
