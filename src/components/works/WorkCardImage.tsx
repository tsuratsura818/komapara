"use client";

import { useState } from "react";
import Image from "next/image";

export function WorkCardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* プレースホルダーを常に背景に表示 */}
      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-50">
        <span className="text-lg font-bold bg-linear-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent select-none">
          コマパラ
        </span>
      </div>

      {/* 画像が失敗していなければNext.js Imageで表示（失敗したら除去） */}
      {!failed && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
