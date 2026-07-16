"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelState, ImportedData, MAX_PANELS } from "./types";
import { PanelPreview } from "./PanelPreview";

type Props = {
  onImportComplete: (data: ImportedData) => void;
  onBack: () => void;
};

export function ImportFromX({ onImportComplete, onBack }: Props) {
  const router = useRouter();
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [importedPanels, setImportedPanels] = useState<PanelState[] | null>(null);
  const [importedDesc, setImportedDesc] = useState("");
  const [importedXPostUrl, setImportedXPostUrl] = useState("");

  const handleImport = async () => {
    if (!importUrl.trim()) {
      setError("X投稿のURLを入力してください");
      return;
    }
    setError("");
    setImporting(true);
    setImportedPanels(null);

    try {
      const res = await fetch("/api/import-from-x", {
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

      const cleanText = (data.text || "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/#\S+/g, "")
        .trim()
        .slice(0, 200);
      setImportedDesc(cleanText);
      setImportedXPostUrl(data.xPostUrl || importUrl.trim());
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
      xPostUrl: importedXPostUrl,
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

      <h1 className="text-xl font-bold text-komapara-text mb-6 flex items-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Xからインポート
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-komapara-like text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs text-komapara-muted mb-3">X投稿のURLを貼り付けると、画像を自動取得します</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://x.com/user/status/..."
            className="flex-1 px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-accent"
            disabled={importing}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
            className="px-5 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
            <PanelPreview panels={importedPanels} />
          </div>

          <button
            onClick={handleProceed}
            className="w-full py-3 text-white font-semibold bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
          >
            この画像で次へ進む
          </button>
        </>
      )}
    </div>
  );
}
