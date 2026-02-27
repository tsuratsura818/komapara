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
      className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
        following
          ? "bg-gray-100 text-komapara-muted hover:bg-gray-200"
          : "bg-primary-500 text-white hover:bg-primary-600"
      }`}
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}
