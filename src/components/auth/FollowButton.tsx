"use client";

import { useState } from "react";

export function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

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
          : "bg-gradient-main text-white shadow-lg shadow-purple-500/25 hover:shadow-xl"
      }`}
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}
