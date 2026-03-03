"use client";

import { PanelState } from "./types";

type Props = {
  panels: PanelState[];
  onRemove?: (index: number) => void;
  compact?: boolean;
};

export function PanelPreview({ panels, onRemove, compact }: Props) {
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {panels.map((panel, i) => (
          <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg border border-komapara-border overflow-hidden">
            {panel.preview && (
              <img src={panel.preview} alt={`${i + 1}コマ目`} className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1 rounded-tr">
              {i + 1}
            </div>
          </div>
        ))}
      </div>
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
