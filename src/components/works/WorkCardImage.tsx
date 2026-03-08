"use client";

import { useState } from "react";

export function WorkCardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* 常にプレースホルダーを背景に表示 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <svg viewBox="0 0 80 32" className="w-16 h-auto opacity-60" aria-hidden="true">
          <defs>
            <linearGradient id="kp-logo-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <text
            x="40" y="22"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontWeight="700"
            fontSize="18"
            fill="url(#kp-logo-grad)"
          >
            コマパラ
          </text>
        </svg>
      </div>

      {/* 画像が成功したら上に重ねて表示、失敗したら消す */}
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ color: "transparent" }} /* alt テキストを非表示 */
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
