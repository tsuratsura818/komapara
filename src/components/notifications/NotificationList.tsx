"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

const TYPE_ICONS: Record<string, string> = {
  new_work: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  like: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  comment: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  follow: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  tip: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

export function NotificationList({
  onClose,
  onRead,
}: {
  onClose: () => void;
  onRead: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notifications?limit=20");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onRead();
    } catch {}
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto glass rounded-xl border border-white/20 shadow-xl z-50">
      <div className="sticky top-0 glass border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-komapara-text">通知</h3>
        <button
          onClick={markAllRead}
          className="text-xs text-primary-500 hover:text-primary-600 transition-colors"
        >
          すべて既読
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-komapara-muted text-sm">
          読み込み中...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-6 text-center text-komapara-muted text-sm">
          通知はありません
        </div>
      ) : (
        <div>
          {notifications.map((n) => {
            const iconPath = TYPE_ICONS[n.type] || TYPE_ICONS.new_work;
            const content = (
              <div
                className={`flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                  !n.isRead ? "bg-primary-50/30" : ""
                }`}
              >
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
                      d={iconPath}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-komapara-text truncate">
                    {n.title}
                  </p>
                  <p className="text-xs text-komapara-muted truncate">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-komapara-muted mt-0.5">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
                )}
              </div>
            );

            return n.link ? (
              <Link
                key={n.id}
                href={n.link}
                onClick={onClose}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
