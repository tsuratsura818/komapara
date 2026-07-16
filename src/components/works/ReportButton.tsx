"use client";

import { useState } from "react";

const REASONS = [
  { value: "spam", label: "スパム・宣伝" },
  { value: "inappropriate", label: "不適切なコンテンツ" },
  { value: "copyright", label: "著作権侵害" },
  { value: "other", label: "その他" },
];

export function ReportButton({ workId }: { workId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason) { setError("理由を選択してください"); return; }
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/works/${workId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, detail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "通報に失敗しました");
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "通報に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-400 transition-colors"
      >
        通報
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative glass rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            {done ? (
              <>
                <p className="text-center text-sm font-medium text-gray-700">
                  通報を受け付けました。ご協力ありがとうございます。
                </p>
                <button
                  onClick={() => { setOpen(false); setDone(false); setReason(""); setDetail(""); }}
                  className="w-full py-2 text-sm glass rounded-xl text-gray-500 hover:text-gray-700"
                >
                  閉じる
                </button>
              </>
            ) : (
              <>
                <h2 className="text-base font-bold text-gray-800">この作品を通報する</h2>

                {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg p-2">{error}</p>}

                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-violet-500"
                      />
                      <span className="text-sm text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="詳細（任意）"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm glass rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 resize-none"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 text-sm glass rounded-xl text-gray-500 hover:text-gray-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 transition-all"
                  >
                    {sending ? "送信中..." : "通報する"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
