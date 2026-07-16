"use client";

import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string | null;
};

type Step = "select" | "confirm" | "success" | "error";

export function SubscribeModal({
  creatorName,
  plans,
  onClose,
  onSuccess,
}: {
  creatorId: string;
  creatorName: string | null;
  plans: Plan[];
  onClose: () => void;
  onSuccess?: (subscription: { id: string; status: string; plan: { name: string; price: number } }) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(plans.length === 1 ? plans[0] : null);
  const [step, setStep] = useState<Step>("select");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    if (!selectedPlan || submitting) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription", planId: selectedPlan.id }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setStep("success");
          onSuccess?.({
            id: data.id,
            status: data.status,
            plan: { name: selectedPlan.name, price: selectedPlan.price },
          });
        }
      } else {
        setErrorMessage(data.error || "購読の開始に失敗しました");
        setStep("error");
      }
    } catch {
      setErrorMessage("ネットワークエラーが発生しました");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gradient-text">サブスクリプション</h2>
          <button
            onClick={onClose}
            className="text-komapara-muted hover:text-komapara-text p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "select" && (
          <>
            <p className="text-sm text-komapara-muted mb-4">
              {creatorName || "クリエイター"}さんを月額サブスクで応援
            </p>

            <div className="space-y-3 mb-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    selectedPlan?.id === plan.id
                      ? "bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
                      : "glass text-komapara-text hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.name}</span>
                    <span className="font-bold">{plan.price.toLocaleString()}円/月</span>
                  </div>
                  {plan.description && (
                    <p className={`text-xs mt-1 ${selectedPlan?.id === plan.id ? "text-white/80" : "text-komapara-muted"}`}>
                      {plan.description}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!selectedPlan}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-linear-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200"
            >
              {selectedPlan ? `${selectedPlan.price.toLocaleString()}円/月で購読する` : "プランを選択してください"}
            </button>

          </>
        )}

        {step === "confirm" && selectedPlan && (
          <div className="text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-sm text-komapara-text mb-1">
              {creatorName || "クリエイター"}さんの
            </p>
            <p className="text-lg font-bold text-komapara-text mb-1">
              {selectedPlan.name}
            </p>
            <p className="text-2xl font-bold gradient-text mb-4">
              月額 {selectedPlan.price.toLocaleString()}円
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("select")}
                className="flex-1 py-3 rounded-xl text-sm font-medium glass text-komapara-muted hover:bg-gray-50 transition-all"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-linear-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all"
              >
                {submitting ? "処理中..." : "お支払いへ進む"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && selectedPlan && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold gradient-text mb-2">購読を開始しました！</p>
            <p className="text-sm text-komapara-muted mb-4">
              {creatorName || "クリエイター"}さんの「{selectedPlan.name}」を購読中です
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-medium bg-gradient-main text-white shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all"
            >
              閉じる
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">😢</div>
            <p className="text-lg font-bold text-red-500 mb-2">エラーが発生しました</p>
            <p className="text-sm text-komapara-muted mb-4">{errorMessage}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("select")}
                className="flex-1 py-3 rounded-xl text-sm font-medium glass text-komapara-muted hover:bg-gray-50 transition-all"
              >
                やり直す
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-gradient-main text-white transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
