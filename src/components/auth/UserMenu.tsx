"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || ""}
            className="w-8 h-8 rounded-full ring-2 ring-purple-200/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-600 font-medium text-sm">
            {session.user.name?.[0] || "?"}
          </div>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-2xl shadow-purple-500/10 z-50 py-1 animate-scale-in">
            <div className="px-4 py-2 border-b border-white/20">
              <p className="text-sm font-medium text-komapara-text truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-komapara-muted truncate">
                {session.user.email}
              </p>
            </div>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-komapara-text hover:bg-purple-50/50 transition-colors"
            >
              ダッシュボード
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-komapara-text hover:bg-purple-50/50 transition-colors"
            >
              設定
            </Link>
            <button
              onClick={() => signOut()}
              className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50/50 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}
