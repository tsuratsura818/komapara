"use client";

import { useState } from "react";

export function WorkCardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Placeholder />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
}

function Placeholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <svg viewBox="0 0 80 32" className="w-20 h-auto" aria-label="コマパラ">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <text
          x="40"
          y="22"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontWeight="700"
          fontSize="18"
          fill="url(#logo-grad)"
        >
          コマパラ
        </text>
      </svg>
    </div>
  );
}
