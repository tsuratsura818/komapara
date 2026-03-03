"use client";

import { ImportMethod } from "./types";

type Props = {
  onSelect: (method: ImportMethod) => void;
};

const methods: { key: ImportMethod; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: "x",
    title: "Xからインポート",
    desc: "X投稿のURLから画像を自動取得します",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    title: "Instagramからインポート",
    desc: "Instagram投稿のURLから画像を自動取得します",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    key: "direct",
    title: "直接アップロード",
    desc: "画像ファイルを選択してアップロードします",
    icon: (
      <svg className="w-8 h-8 text-komapara-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export function MethodSelector({ onSelect }: Props) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-komapara-text mb-6">作品を投稿する</h1>

      <p className="text-sm text-komapara-muted mb-4">投稿方法を選んでください</p>

      <div className="space-y-3">
        {methods.map((m) => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className="w-full p-5 glass rounded-xl border border-white/20 hover:border-primary-300 hover:shadow-lg transition-all text-left flex items-center gap-4"
          >
            <div className="flex-shrink-0">{m.icon}</div>
            <div>
              <div className="font-semibold text-komapara-text">{m.title}</div>
              <div className="text-xs text-komapara-muted mt-0.5">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
