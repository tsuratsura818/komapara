"use client";

import { useState } from "react";

type Step = "confirm" | "processing" | "success" | "error";

export function PremiumModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<Step>("confirm");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    setStep("processing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "premium" }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setStep("success");
          onSuccess?.();
        }
      } else {
        setErrorMessage(data.error || "購読の開始に失敗しました");
        setStep("error");
      }
    } catch {
      setErrorMessage("ネットワークエラーが発生しました");
      setStep("error");
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
          <h2 className="text-lg font-bold gradient-text">プレミアム会員</h2>
          <button
            onClick={onClose}
            className="text-komapara-muted hover:text-komapara-text p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "confirm" && (
          <div className="text-center">
            <div className="text-4xl mb-3">👑</div>
            <p className="text-lg font-bold text-komapara-text mb-2">
              広告を非表示にする
            </p>
            <p className="text-2xl font-bold gradient-text mb-2">
              月額 300円
            </p>
            <div className="text-left glass rounded-xl p-4 mb-4">
              <ul className="space-y-2 text-sm text-komapara-text">
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
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-medium glass text-komapara-muted hover:bg-gray-50 transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
              >
                お支払いへ進む
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full mx-auto mb-4" />
            <p className="text-sm text-komapara-muted">処理中...</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold gradient-text mb-2">
              プレミアム会員になりました！
            </p>
            <p className="text-sm text-komapara-muted mb-4">
              すべての広告が非表示になりました
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
            <p className="text-lg font-bold text-red-500 mb-2">
              エラーが発生しました
            </p>
            <p className="text-sm text-komapara-muted mb-4">{errorMessage}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("confirm")}
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
