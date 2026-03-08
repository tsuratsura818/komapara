"use client";

import { useState, useEffect } from "react";

export function WorkCardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(false);
    img.src = src;
  }, [src]);

  return (
    <div className="relative w-full h-full">
      {/* プレースホルダーは常に背景に表示 */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <span className="text-lg font-bold bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent select-none">
          コマパラ
        </span>
      </div>

      {/* 画像のロード成功時のみ表示 */}
      {loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
    </div>
  );
}
