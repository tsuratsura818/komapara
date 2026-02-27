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
        className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
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
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
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
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-komapara-border z-50 py-1">
            <div className="px-4 py-2 border-b border-komapara-border">
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
              className="block px-4 py-2 text-sm text-komapara-text hover:bg-gray-50"
            >
              ダッシュボード
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-komapara-text hover:bg-gray-50"
            >
              設定
            </Link>
            <button
              onClick={() => signOut()}
              className="block w-full text-left px-4 py-2 text-sm text-komapara-like hover:bg-gray-50"
            >
              ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}
