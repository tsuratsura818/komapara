"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UserActions({
  userId,
  isBanned,
}: {
  userId: string;
  isBanned: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggleBan() {
    if (!confirm(isBanned ? "このユーザーのBANを解除しますか？" : "このユーザーをBANしますか？")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !isBanned }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
        return;
      }
      router.refresh();
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleBan}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${
        isBanned
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      }`}
    >
      {loading ? "..." : isBanned ? "BAN解除" : "BAN"}
    </button>
  );
}
