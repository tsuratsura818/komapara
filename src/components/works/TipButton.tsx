"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { TipModal } from "./TipModal";

export function TipButton({
  workId,
  authorId,
  authorName,
  onSuccess,
}: {
  workId: string;
  authorId: string;
  authorName: string | null;
  onSuccess?: () => void;
}) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);

  const isOwnWork = session?.user?.id === authorId;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={!session || isOwnWork}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          !session
            ? "ログインが必要です"
            : isOwnWork
              ? "自分の作品には投げ銭できません"
              : "投げ銭を送る"
        }
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        投げ銭
      </button>

      {showModal && (
        <TipModal
          workId={workId}
          authorName={authorName}
          onClose={() => setShowModal(false)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
