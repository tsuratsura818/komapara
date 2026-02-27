"use client";

import { useState } from "react";

const PRESET_AMOUNTS = [100, 300, 500, 1000];

type Step = "select" | "confirm" | "success" | "error";

export function TipModal({
  workId,
  authorName,
  onClose,
  onSuccess,
}: {
  workId: string;
  authorName: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentAmount = isCustom ? parseInt(customAmount) || 0 : selectedAmount;
  const isValidAmount = currentAmount >= 100 && currentAmount <= 10000;

  const handleSubmit = async () => {
    if (!isValidAmount || submitting) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId,
          amount: currentAmount,
          message: message.trim() || undefined,
        }),
      });

      if (res.ok) {
        setStep("success");
        onSuccess?.();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "投げ銭に失敗しました");
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
          <h2 className="text-lg font-bold gradient-text">投げ銭</h2>
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
              {authorName || "クリエイター"}さんに投げ銭を送る
            </p>

            {/* Preset amounts */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setSelectedAmount(amount); setIsCustom(false); }}
                  className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    !isCustom && selectedAmount === amount
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "glass text-komapara-text hover:bg-gray-50"
                  }`}
                >
                  {amount.toLocaleString()}円
                </button>
              ))}
            </div>

            {/* Custom amount toggle */}
            <button
              onClick={() => { setIsCustom(true); setCustomAmount(""); }}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-3 ${
                isCustom
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/25"
                  : "glass text-komapara-text hover:bg-gray-50"
              }`}
            >
              カスタム金額
            </button>

            {isCustom && (
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="100〜10,000"
                    min={100}
                    max={10000}
                    className="flex-1 px-3 py-2 text-sm glass rounded-xl border border-komapara-border focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <span className="text-sm text-komapara-muted">円</span>
                </div>
                {customAmount && !isValidAmount && (
                  <p className="text-xs text-red-500 mt-1">100円〜10,000円で入力してください</p>
                )}
              </div>
            )}

            {/* Message */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="応援メッセージ（任意・200文字以内）"
              maxLength={200}
              className="w-full px-3 py-2 text-sm glass rounded-xl border border-komapara-border focus:outline-none focus:ring-2 focus:ring-orange-500/50 mb-4"
            />

            <button
              onClick={() => setStep("confirm")}
              disabled={!isValidAmount}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200"
            >
              {isValidAmount ? `${currentAmount.toLocaleString()}円を送る` : "金額を選択してください"}
            </button>

            <p className="text-xs text-komapara-muted text-center mt-2">
              ※ 現在はモック決済です（実際の課金は発生しません）
            </p>
          </>
        )}

        {step === "confirm" && (
          <div className="text-center">
            <div className="text-4xl mb-3">🎁</div>
            <p className="text-sm text-komapara-text mb-1">
              {authorName || "クリエイター"}さんに
            </p>
            <p className="text-2xl font-bold gradient-text mb-4">
              {currentAmount.toLocaleString()}円
            </p>
            {message && (
              <p className="text-sm text-komapara-muted mb-4 glass rounded-xl p-3">
                「{message}」
              </p>
            )}
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
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/25 disabled:opacity-50 transition-all"
              >
                {submitting ? "送信中..." : "確定する"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold gradient-text mb-2">投げ銭を送りました！</p>
            <p className="text-sm text-komapara-muted mb-4">
              {authorName || "クリエイター"}さんに{currentAmount.toLocaleString()}円を送りました
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
