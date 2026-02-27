import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アカウント設定",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-komapara-text mb-6">
        アカウント設定
      </h1>

      <div className="bg-white rounded-xl border border-komapara-border p-6">
        <div className="flex items-center gap-4 mb-6">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || ""}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
              {session.user.name?.[0] || "?"}
            </div>
          )}
          <div>
            <p className="font-medium text-komapara-text">
              {session.user.name}
            </p>
            <p className="text-sm text-komapara-muted">{session.user.email}</p>
          </div>
        </div>

        <p className="text-sm text-komapara-muted">
          プロフィール編集機能は近日公開予定です。
        </p>
      </div>
    </div>
  );
}
