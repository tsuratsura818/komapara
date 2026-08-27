"use client";

import { useState } from "react";

export function StripeConnectCard({
  isConnected,
  chargesEnabled,
}: {
  isConnected: boolean;
  chargesEnabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || "Stripe連携の開始に失敗しました");
      }
    } catch {
      setErrorMessage("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <h2 className="text-lg font-bold gradient-text mb-4">収益受取設定</h2>

      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Stripe連携済み
            </span>
          </div>

          {chargesEnabled ? (
            <p className="text-sm text-komapara-muted">
              収益の受取が有効です。クリエイター還元を受け取ることができます。
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-yellow-600">
                Stripeアカウントの設定が完了していません。追加情報の入力が必要です。
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-linear-to-r from-blue-500 to-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200"
              >
                {loading ? "処理中..." : "設定を続ける"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-komapara-muted">
            クリエイター還元を受け取るには、決済アカウントを連携してください。
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-linear-to-r from-blue-500 to-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200"
          >
            {loading ? "処理中..." : "Stripeアカウントを連携する"}
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="text-sm text-red-500 mt-3">{errorMessage}</p>
      )}
    </div>
  );
}
