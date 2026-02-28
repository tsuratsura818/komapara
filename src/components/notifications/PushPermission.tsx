"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushPermission() {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    // 既に許可済みなら非表示
    if (Notification.permission === "granted") {
      setDismissed(true);
    }
    // ローカルストレージで非表示チェック
    if (localStorage.getItem("push-prompt-dismissed")) {
      setDismissed(true);
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const sub = subscription.toJSON();
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: sub.keys,
        }),
      });

      setDismissed(true);
    } catch (err) {
      console.error("Push subscription error:", err);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("push-prompt-dismissed", "1");
  };

  // 非表示条件
  if (!session?.user?.id || dismissed || permission === "unsupported" || permission === "denied") {
    return null;
  }

  return (
    <div className="mx-4 mt-2 p-3 glass rounded-xl border border-white/20 flex items-center gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-main flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-komapara-text">
          新作通知を受け取りませんか？
        </p>
        <p className="text-xs text-komapara-muted">
          フォロー中の作家の新作をプッシュ通知でお知らせします
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={subscribe}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          許可
        </button>
        <button
          onClick={dismiss}
          className="px-3 py-1.5 text-xs text-komapara-muted hover:text-komapara-text transition-colors"
        >
          後で
        </button>
      </div>
    </div>
  );
}
