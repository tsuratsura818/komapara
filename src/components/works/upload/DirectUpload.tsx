"use client";

import { useCallback } from "react";
import { PanelState, MIN_PANELS, MAX_PANELS, emptyPanel } from "./types";

type Props = {
  panels: PanelState[];
  panelCount: number;
  onPanelsChange: (panels: PanelState[]) => void;
  onPanelCountChange: (count: number) => void;
  onReady: () => void;
  onBack: () => void;
  setError: (error: string) => void;
};

export function DirectUpload({
  panels,
  panelCount,
  onPanelsChange,
  onPanelCountChange,
  onReady,
  onBack,
  setError,
}: Props) {
  const changePanelCount = (newCount: number) => {
    const clamped = Math.max(MIN_PANELS, Math.min(MAX_PANELS, newCount));
    onPanelCountChange(clamped);
    if (clamped > panels.length) {
      onPanelsChange([...panels, ...Array.from({ length: clamped - panels.length }, emptyPanel)]);
    } else if (clamped < panels.length) {
      for (let i = clamped; i < panels.length; i++) {
        if (panels[i].preview && panels[i].file) {
          URL.revokeObjectURL(panels[i].preview!);
        }
      }
      onPanelsChange(panels.slice(0, clamped));
    }
  };

  const handleFileSelect = useCallback(
    (index: number, file: File) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("JPEG、PNG、WebPのみ対応しています");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("ファイルサイズは5MB以下にしてください");
        return;
      }
      setError("");
      const preview = URL.createObjectURL(file);
      const next = [...panels];
      next[index] = { ...next[index], file, preview, url: null };
      onPanelsChange(next);
    },
    [panels, onPanelsChange, setError]
  );

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(index, file);
    },
    [handleFileSelect]
  );

  const removePanel = useCallback(
    (index: number) => {
      const next = [...panels];
      if (next[index].preview && next[index].file) {
        URL.revokeObjectURL(next[index].preview!);
      }
      next[index] = emptyPanel();
      onPanelsChange(next);
    },
    [panels, onPanelsChange]
  );

  const allReady = panels.every((p) => p.file || p.url);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-sm text-komapara-muted hover:text-komapara-text mb-4 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        戻る
      </button>

      <h1 className="text-xl font-bold text-komapara-text mb-6">画像をアップロード</h1>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-komapara-text">画像（{panelCount}枚）</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changePanelCount(panelCount - 1)}
            disabled={panelCount <= MIN_PANELS}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-komapara-border text-komapara-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            -
          </button>
          <span className="text-sm font-medium text-komapara-text w-8 text-center">{panelCount}</span>
          <button
            type="button"
            onClick={() => changePanelCount(panelCount + 1)}
            disabled={panelCount >= MAX_PANELS}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-komapara-border text-komapara-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            +
          </button>
        </div>
      </div>
      <p className="text-xs text-komapara-muted mb-3">{MIN_PANELS}〜{MAX_PANELS}枚まで設定可</p>

      <div className="space-y-3 mb-6">
        {panels.map((panel, index) => (
          <div
            key={index}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(index, e)}
            className="relative"
          >
            {panel.preview ? (
              <div className="relative rounded-lg border border-komapara-border">
                <img
                  src={panel.preview}
                  alt={`${index + 1}コマ目`}
                  className="w-full h-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePanel(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-sm">
                  {index + 1}コマ目
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-komapara-border rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors">
                <svg className="w-8 h-8 text-komapara-muted mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-komapara-muted">{index + 1}コマ目を選択</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(index, file);
                  }}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onReady}
        disabled={!allReady}
        className="w-full py-3 text-white font-semibold bg-primary-500 rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        次へ進む
      </button>
      {!allReady && (
        <p className="mt-2 text-xs text-komapara-muted text-center">
          画像をあと{panels.filter((p) => !p.file && !p.url).length}枚選択してください
        </p>
      )}
    </div>
  );
}
