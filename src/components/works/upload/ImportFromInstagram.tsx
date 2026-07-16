"use client";

import { useState, useEffect, useCallback } from "react";
import { ImportedData, PanelState } from "./types";

type Props = {
  onImportComplete: (data: ImportedData) => void;
  onBack: () => void;
  onSwitchToDirect: () => void;
};

type IgStatus = { configured: boolean; connected: boolean; username: string | null };
type IgItem = {
  id: string;
  caption: string;
  permalink: string;
  thumbnail: string;
  count: number;
  type: string;
};

export function ImportFromInstagram({ onImportComplete, onBack, onSwitchToDirect }: Props) {
  const [status, setStatus] = useState<IgStatus | null>(null);
  const [items, setItems] = useState<IgItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/instagram/media");
      const d = await r.json();
      if (r.ok) setItems(d.items || []);
      else setError(d.error || "投稿の取得に失敗しました");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // コールバックからの戻り（?ig=xxx）を通知
    const ig = new URLSearchParams(window.location.search).get("ig");
    if (ig && ig !== "connected") {
      setError(
        ig === "denied"
          ? "連携がキャンセルされました"
          : "連携でエラーが発生しました。もう一度お試しください"
      );
    }
    fetch("/api/instagram/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: IgStatus | null) => {
        setStatus(s ?? { configured: false, connected: false, username: null });
        if (s?.connected) loadMedia();
      })
      .catch(() => setStatus({ configured: false, connected: false, username: null }));
  }, [loadMedia]);

  const handleImport = async (item: IgItem) => {
    setImporting(item.id);
    setError("");
    try {
      const r = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: item.id }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "取り込みに失敗しました");
        return;
      }
      const panels: PanelState[] = (d.panels as string[]).map((url) => ({
        file: null,
        preview: url,
        uploading: false,
        url,
      }));
      onImportComplete({
        panels,
        panelCount: panels.length,
        description: (d.caption || "").slice(0, 200),
        xPostUrl: "",
      });
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setImporting(null);
    }
  };

  const disconnect = async () => {
    if (!confirm("Instagram連携を解除しますか？")) return;
    await fetch("/api/instagram/status", { method: "DELETE" }).catch(() => {});
    setStatus((s) => (s ? { ...s, connected: false, username: null } : s));
    setItems([]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={onBack} className="text-sm text-komapara-muted hover:text-komapara-text mb-4">
        ← 投稿方法を選び直す
      </button>

      <h2 className="text-lg font-bold text-komapara-text mb-1">Instagramから取り込み</h2>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* 準備中（未設定） */}
      {status && !status.configured && (
        <div className="rounded-xl border border-komapara-border bg-komapara-card p-6 text-center">
          <p className="text-sm text-komapara-muted mb-4">
            Instagram連携は現在準備中です。<br />
            今は「直接アップロード」または「Xから取り込み」をご利用ください。
          </p>
          <button
            onClick={onSwitchToDirect}
            className="px-5 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-blue-700 transition-colors"
          >
            直接アップロードに切り替え
          </button>
        </div>
      )}

      {/* 未連携 → 連携ボタン */}
      {status?.configured && !status.connected && (
        <div className="rounded-xl border border-komapara-border bg-komapara-card p-6 text-center">
          <p className="text-sm text-komapara-muted mb-1">
            Instagramアカウントを連携すると、
          </p>
          <p className="text-sm text-komapara-text font-semibold mb-5">
            あなたの投稿を選ぶだけで取り込めます（URL貼り付け不要・カルーセル全コマ対応）
          </p>
          <a
            href="/api/instagram/connect"
            className="inline-block px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-lg hover:bg-blue-700 transition-colors"
          >
            Instagramを連携する
          </a>
          <p className="text-[11px] text-komapara-muted mt-4">
            ※ Instagramのプロアカウント（ビジネス/クリエイター）が必要です
          </p>
        </div>
      )}

      {/* 連携済み → 投稿グリッド */}
      {status?.connected && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-komapara-muted">
              連携中{status.username ? `：@${status.username}` : ""} · 投稿を選んで取り込み
            </p>
            <button onClick={disconnect} className="text-xs text-komapara-muted hover:text-red-500">
              連携を解除
            </button>
          </div>

          {loading && <p className="text-sm text-komapara-muted text-center py-10">投稿を読み込み中...</p>}

          {!loading && items.length === 0 && (
            <p className="text-sm text-komapara-muted text-center py-10">
              取り込める画像投稿が見つかりませんでした
            </p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleImport(item)}
                disabled={!!importing}
                className="relative aspect-square rounded-lg overflow-hidden border border-komapara-border group disabled:opacity-50"
                title={item.caption}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                {item.count > 1 && (
                  <span className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 bg-black/60 text-white rounded">
                    {item.count}枚
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-accent/0 group-hover:bg-accent/70 transition-colors">
                  <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">
                    {importing === item.id ? "取り込み中..." : "取り込む"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {!status && <p className="text-sm text-komapara-muted text-center py-10">読み込み中...</p>}
    </div>
  );
}
