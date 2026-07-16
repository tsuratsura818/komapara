"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function FollowButton({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // フォロー状態はクライアントで取得（creatorページのISR共有キャッシュ化のため）
  useEffect(() => {
    if (!session?.user?.id) {
      setVisible(false);
      return;
    }
    fetch(`/api/follows/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || d.isSelf) {
          setVisible(false);
          return;
        }
        setFollowing(d.following);
        setVisible(true);
      })
      .catch(() => {});
  }, [session?.user?.id, userId]);

  if (!visible) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/follows/${userId}`, { method });
      if (res.ok) {
        setFollowing(!following);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
        following
          ? "glass text-komapara-muted hover:bg-gray-100"
          : "bg-gradient-main text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
      }`}
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}
