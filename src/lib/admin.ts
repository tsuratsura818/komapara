import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function isAdminUser(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

/** Server Component用ガード。管理者でなければ "/" にリダイレクト */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdminUser(session.user.id)) {
    redirect("/");
  }
  return session;
}

/** API Route用ガード。認証/権限エラー時は error を返す */
export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
      session: null,
    };
  }
  if (!isAdminUser(session.user.id)) {
    return {
      error: NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      ),
      session: null,
    };
  }
  return { error: null, session };
}

/** SiteSettingテーブルから値を取得。未設定ならデフォルト値を返す */
export async function getSiteSetting(
  key: string,
  defaultValue: string = "true"
): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value ?? defaultValue;
}
