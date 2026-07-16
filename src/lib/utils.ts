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

/**
 * SNSシェア文面用にキャプションを整形する。
 * IG/Xから取り込んだ説明文は区切り線・誘導文・ハッシュタグ・メンションが大半で、
 * そのままシェアカードに出すと「何の作品か分からない」ノイズになるため除去する。
 * 作品ページ側は作家が書いたまま表示するので、ここでの整形はシェア文面限定。
 */
export function cleanCaptionForShare(text: string | null | undefined): string {
  return (text || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/#[^\s#]+/g, "")
    .replace(/@[A-Za-z0-9_.]+/g, "")
    .replace(/^[\s\-–—ー─━＝=*_~]{3,}$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Xシェア用の文面を自動生成する。
 * タイトルとURLだけでは流れてきた人に何の作品か伝わらないため、
 * 作家クレジット（Xアカウントがあれば@メンションして通知/導線にする）と
 * ジャンルのハッシュタグまで組み立てる。
 * 説明文はOGカード側が表示するので本文には入れない（取り込みキャプションは
 * 誘導文が大半で、本文に出すとノイズになるため）。
 */
export function buildWorkShareText(work: {
  title: string;
  authorName?: string | null;
  authorXHandle?: string | null;
  genres?: { name: string }[];
}): string {
  const handle = work.authorXHandle?.trim().replace(/^@/, "");
  const credit = handle ? `@${handle}` : work.authorName?.trim();

  const tags = [
    "#4コマ漫画",
    ...(work.genres ?? []).slice(0, 2).map((g) => `#${g.name.replace(/\s+/g, "")}`),
    "#コマパラ",
  ].join(" ");

  const lines = [`「${work.title}」`];
  if (credit) lines.push(`${credit}の4コマ漫画`);
  lines.push("", tags);
  return lines.join("\n");
}
