"use client";

import { useState } from "react";
import { PanelState } from "./types";

type Props = {
  panels: PanelState[];
  onRemove?: (index: number) => void;
  compact?: boolean;
};

export function PanelPreview({ panels, onRemove, compact }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (compact) {
    return (
      <>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {panels.map((panel, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 w-28 h-28 rounded-lg border border-komapara-border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
              onClick={() => setLightboxIndex(i)}
            >
              {panel.preview && (
                <img src={panel.preview} alt={`${i + 1}コマ目`} className="w-full h-full object-cover" />
              )}
              <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-tr">
                {i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* ライトボックス */}
        {lightboxIndex !== null && panels[lightboxIndex]?.preview && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={panels[lightboxIndex].preview}
                alt={`${lightboxIndex + 1}コマ目`}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {lightboxIndex + 1} / {panels.length}
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
              >
                ✕
              </button>
              {/* 前後ナビ */}
              {lightboxIndex > 0 && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {lightboxIndex < panels.length - 1 && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-3">
      {panels.map((panel, i) => (
        <div key={i} className="relative">
          {panel.preview ? (
            <div className="relative rounded-lg border border-komapara-border">
              <img
                src={panel.preview}
                alt={`${i + 1}コマ目`}
                className={`w-full h-auto rounded-lg transition-opacity ${panel.uploading ? "opacity-50" : ""}`}
              />
              {panel.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
              )}
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {i + 1}コマ目
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-komapara-border rounded-lg text-sm text-komapara-muted">
              {i + 1}コマ目（未選択）
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
