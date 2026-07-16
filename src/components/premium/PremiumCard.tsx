"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PremiumModal } from "./PremiumModal";

type PremiumSubscription = {
  id: string;
  status: string;
  amount: number;
  currentPeriodEnd: string;
  createdAt: string;
} | null;

export function PremiumCard({
  currentSubscription,
  isPremium,
  premiumEnabled,
}: {
  currentSubscription: PremiumSubscription;
  isPremium: boolean;
  premiumEnabled: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  if (!premiumEnabled) return null;

  const handleCancel = async () => {
    if (!confirm("プレミアムを解約しますか？期間終了まではご利用いただけます。")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/premium", { method: "DELETE" });
      if (res.ok) {
        router.refresh();
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

  // アクティブなプレミアム
  if (isPremium && currentSubscription) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">👑</span>
          <div>
            <h3 className="font-bold gradient-text">プレミアム会員</h3>
            <p className="text-xs text-komapara-muted">広告非表示プラン</p>
          </div>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
            currentSubscription.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {currentSubscription.status === "active" ? "有効" : "解約済み"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-yellow-50 to-orange-50">
            <p className="text-lg font-bold bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {currentSubscription.amount}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">月額</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-purple-50 to-blue-50">
            <p className="text-sm font-bold bg-linear-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString("ja-JP")}
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">有効期限</p>
          </div>
        </div>

        {currentSubscription.status === "active" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-2 rounded-xl text-sm font-medium glass text-komapara-muted hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {cancelling ? "処理中..." : "解約する"}
          </button>
        )}

        {currentSubscription.status === "cancelled" && (
          <p className="text-xs text-komapara-muted text-center">
            {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString("ja-JP")}まで広告非表示が有効です
          </p>
        )}
      </div>
    );
  }

  // 未購読
  return (
    <>
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">👑</span>
          <div>
            <h3 className="font-bold gradient-text">プレミアム会員</h3>
            <p className="text-xs text-komapara-muted">広告を非表示にして快適に</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-3xl font-bold gradient-text">300円<span className="text-lg">/月</span></p>
        </div>

        <ul className="space-y-2 text-sm text-komapara-text mb-4">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            すべての広告を非表示
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            快適な作品閲覧体験
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            いつでも解約可能
          </li>
        </ul>

        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 rounded-xl text-sm font-bold text-white bg-linear-to-r from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
        >
          プレミアムになる
        </button>

        <p className="text-xs text-komapara-muted text-center mt-2">
          ※ 現在はモック決済です
        </p>
      </div>

      {showModal && (
        <PremiumModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
