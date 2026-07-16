"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WorkActions({
  workId,
  isPublished,
  isPickup = false,
}: {
  workId: string;
  isPublished: boolean;
  isPickup?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 今週のピックアップ（トップに1作品だけ出る。立てると他は自動で下りる）
  async function togglePickup() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/works/${workId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPickup: !isPickup }),
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

  async function togglePublish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/works/${workId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
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

  async function handleDelete() {
    if (!confirm("この作品を完全に削除しますか？この操作は取り消せません。")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/works/${workId}`, {
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
    <div className="flex items-center gap-1 justify-center">
      <button
        onClick={togglePickup}
        disabled={loading}
        title={isPickup ? "ピックアップを解除" : "今週のピックアップにする（他は自動で解除）"}
        className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          isPickup
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
        }`}
      >
        {isPickup ? "★ ピック中" : "ピック"}
      </button>
      <button
        onClick={togglePublish}
        disabled={loading}
        className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          isPublished
            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
            : "bg-green-100 text-green-700 hover:bg-green-200"
        }`}
      >
        {isPublished ? "非公開" : "公開"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs px-2 py-1 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        削除
      </button>
    </div>
  );
}
