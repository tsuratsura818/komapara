"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentActions({ commentId }: { commentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("このコメントを削除しますか？")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
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
      onClick={handleDelete}
      disabled={loading}
      className="text-xs px-3 py-1 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "削除"}
    </button>
  );
}
