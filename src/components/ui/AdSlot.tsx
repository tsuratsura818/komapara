"use client";

import { useSession } from "next-auth/react";
import { AdsenseUnit } from "./AdsenseUnit";

type Ad = {
  id: string;
  company: string;
  imageUrl: string;
  linkUrl: string;
  description: string | null;
};

type AdSlotProps = {
  ad?: Ad | null;
  slot: string;
};

export function AdSlot({ ad, slot }: AdSlotProps) {
  const { data: session } = useSession();
  // プレミアム判定はクライアントのセッションで行う（ページをISR共有キャッシュ化するため）
  if (session?.user?.isPremium) return null;

  if (ad) {
    const handleClick = () => {
      fetch(`/api/ads/${ad.id}/click`, { method: "POST" }).catch(() => null);
    };

    return (
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block w-full rounded-xl overflow-hidden border border-gray-200/60 hover:border-blue-300/60 transition-colors relative"
      >
        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-1.5 py-0.5 bg-black/50 text-white rounded-sm backdrop-blur-xs">
          PR
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.imageUrl}
          alt={`${ad.company}の広告`}
          className="w-full object-cover"
          style={{ maxHeight: 120 }}
        />
        <div className="px-3 py-2 bg-gray-50/80 text-xs text-gray-500 flex items-center justify-between">
          <span className="font-medium text-gray-700 truncate">{ad.company}</span>
          {ad.description && (
            <span className="truncate ml-2 text-gray-400">{ad.description}</span>
          )}
        </div>
      </a>
    );
  }

  return <AdsenseUnit slot={slot} isPremium={false} />;
}
