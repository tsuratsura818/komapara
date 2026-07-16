"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { SubscribeModal } from "./SubscribeModal";

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string | null;
};

type CurrentSubscription = {
  id: string;
  status: string;
  plan: { name: string; price: number };
} | null;

export function SubscribeButton({
  creatorId,
  creatorName,
  plans,
  currentSubscription,
  subscriptionsEnabled = true,
  onSuccess,
}: {
  creatorId: string;
  creatorName: string | null;
  plans: Plan[];
  currentSubscription?: CurrentSubscription;
  subscriptionsEnabled?: boolean;
  onSuccess?: () => void;
}) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [subscription, setSubscription] = useState(currentSubscription || null);
  const [cancelling, setCancelling] = useState(false);

  if (!subscriptionsEnabled || plans.length === 0) return null;

  const isOwnProfile = session?.user?.id === creatorId;
  const isSubscribed = subscription?.status === "active";

  const handleCancel = async () => {
    if (!confirm("購読を解約しますか？")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      if (res.ok) {
        setSubscription(null);
      } else {
        const data = await res.json();
        alert(data.error || "解約に失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setCancelling(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-linear-to-r from-purple-500 to-blue-500 text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          購読中 ({subscription!.plan.name})
        </span>
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="text-xs text-komapara-muted hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {cancelling ? "処理中..." : "解約"}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={!session || isOwnProfile}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          !session
            ? "ログインが必要です"
            : isOwnProfile
              ? "自分のプランには購読できません"
              : "月額サブスクで応援する"
        }
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        サブスクで応援
      </button>

      {showModal && (
        <SubscribeModal
          creatorId={creatorId}
          creatorName={creatorName}
          plans={plans}
          onClose={() => setShowModal(false)}
          onSuccess={(sub) => {
            setSubscription(sub);
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}
