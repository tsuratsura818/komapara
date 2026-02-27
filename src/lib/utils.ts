import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;

  return target.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const GENRES = [
  { slug: "nichijou", name: "日常", emoji: "☀️" },
  { slug: "gag", name: "ギャグ", emoji: "😂" },
  { slug: "ikuji", name: "育児", emoji: "👶" },
  { slug: "neko", name: "猫", emoji: "🐱" },
  { slug: "shigoto", name: "仕事あるある", emoji: "💼" },
  { slug: "renai", name: "恋愛", emoji: "💕" },
  { slug: "kando", name: "感動", emoji: "😢" },
  { slug: "essay", name: "エッセイ", emoji: "✏️" },
] as const;
