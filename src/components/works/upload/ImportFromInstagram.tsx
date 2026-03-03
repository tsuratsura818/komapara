"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelState, ImportedData, MAX_PANELS } from "./types";
import { PanelPreview } from "./PanelPreview";

type Props = {
  onImportComplete: (data: ImportedData) => void;
  onBack: () => void;
  onSwitchToDirect: () => void;
};

export function ImportFromInstagram({ onImportComplete, onBack, onSwitchToDirect }: Props) {
  const router = useRouter();
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [importedPanels, setImportedPanels] = useState<PanelState[] | null>(null);
  const [importedDesc, setImportedDesc] = useState("");
  const [aspectWarning, setAspectWarning] = useState(false);

  const handleImport = async () => {
    if (!importUrl.trim()) {
      setError("Instagram投稿のURLを入力してください");
      return;
    }
    setError("");
    setImporting(true);
    setImportedPanels(null);
    setAspectWarning(false);

    try {
      const res = await fetch("/api/import-from-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/upload");
          return;
        }
        setError(data.error || "インポートに失敗しました");
        return;
      }

      const imageCount = Math.min(data.images.length, MAX_PANELS);
      const panels: PanelState[] = [];
      for (let i = 0; i < imageCount; i++) {
        panels.push({
          file: null,
          preview: data.images[i],
          uploading: false,
          url: data.images[i],
        });
      }
      setImportedPanels(panels);

      // 最初の画像のアスペクト比を確認（正方形ならクロップ警告）
      if (panels[0]?.preview) {
        const img = new Image();
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 0.95 && ratio < 1.05) {
            setAspectWarning(true);
          }
        };
        img.src = panels[0].preview;
      }

      const cleanText = (data.text || "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/#\S+/g, "")
        .trim()
        .slice(0, 200);
      setImportedDesc(cleanText);
    } catch {
      setError("インポートに失敗しました");
    } finally {
      setImporting(false);
    }
  };

  const handleProceed = () => {
    if (!importedPanels) return;
    onImportComplete({
      panels: importedPanels,
      panelCount: importedPanels.length,
      description: importedDesc,
      xPostUrl: "",
    });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-sm text-komapara-muted hover:text-komapara-text mb-4 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        戻る
      </button>

      <h1 className="text-xl font-bold text-komapara-text mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
        Instagramからインポート
      </h1>

      <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
        Instagramの画像は正方形にクロップされている場合があります。元の比率で取得できない場合は「直接アップロード」をお試しください。
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-komapara-like text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs text-komapara-muted mb-3">Instagram投稿のURLを貼り付けると、画像を自動取得します</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            className="flex-1 px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={importing}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
          >
            {importing ? "取得中..." : "取得"}
          </button>
        </div>
      </div>

      {importedPanels && (
        <>
          <div className="mb-4">
            <p className="text-sm font-semibold text-komapara-text mb-2">
              {importedPanels.length}枚の画像を取得しました
            </p>

            {aspectWarning && (
              <div className="mb-3 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                画像が正方形にクロップされている可能性があります。元の画像と比較して確認してください。
              </div>
            )}

            <PanelPreview panels={importedPanels} />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleProceed}
              className="w-full py-3 text-white font-semibold bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
            >
              この画像で次へ進む
            </button>

            <button
              onClick={onSwitchToDirect}
              className="w-full py-2 text-sm text-komapara-muted hover:text-komapara-text transition-colors"
            >
              画像がクロップされている？ → 直接アップロードに切り替え
            </button>
          </div>
        </>
      )}
    </div>
  );
}
