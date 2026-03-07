"use client";

import { useState } from "react";

type Ad = {
  id: string;
  title: string;
  company: string;
  imageUrl: string;
  linkUrl: string;
  description: string | null;
  placement: string;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  sortOrder: number;
  impressions: number;
  clicks: number;
  createdAt: Date;
};

type FormData = {
  title: string;
  company: string;
  imageUrl: string;
  linkUrl: string;
  description: string;
  placement: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  sortOrder: number;
};

const EMPTY_FORM: FormData = {
  title: "",
  company: "",
  imageUrl: "",
  linkUrl: "",
  description: "",
  placement: "feed",
  isActive: true,
  startDate: "",
  endDate: "",
  sortOrder: 0,
};

const PLACEMENT_LABELS: Record<string, string> = {
  feed: "フィード",
  work: "作品詳細",
  all: "全ページ",
};

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function AdvertiseClient({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title,
      company: ad.company,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      description: ad.description ?? "",
      placement: ad.placement,
      isActive: ad.isActive,
      startDate: toDateInput(ad.startDate),
      endDate: toDateInput(ad.endDate),
      sortOrder: ad.sortOrder,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.company || !form.imageUrl || !form.linkUrl) {
      setError("タイトル・企業名・画像URL・リンクURLは必須です");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const body = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        description: form.description || null,
      };

      const res = await fetch(
        editingId ? `/api/admin/advertise/${editingId}` : "/api/admin/advertise",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "保存に失敗しました");
        return;
      }

      const saved = await res.json();

      if (editingId) {
        setAds((prev) => prev.map((a) => (a.id === editingId ? saved : a)));
      } else {
        setAds((prev) => [saved, ...prev]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この広告を削除しますか？")) return;
    const res = await fetch(`/api/admin/advertise/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAds((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleToggle = async (ad: Ad) => {
    const res = await fetch(`/api/admin/advertise/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ad.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">広告管理</h1>
          <p className="text-sm text-gray-500 mt-1">企業広告の掲載管理。広告がない場合はAdSenseが表示されます。</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          + 新規広告追加
        </button>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-lg mb-2">広告がありません</p>
          <p className="text-sm">「新規広告追加」から企業広告を登録してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => {
            const ctr = ad.clicks > 0 && ad.impressions > 0
              ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
              : "—";
            const now = new Date();
            const isLive =
              ad.isActive &&
              (!ad.startDate || new Date(ad.startDate) <= now) &&
              (!ad.endDate || new Date(ad.endDate) >= now);

            return (
              <div
                key={ad.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
              >
                {/* 広告画像 */}
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{ad.title}</span>
                    <span className="text-xs text-gray-400">{ad.company}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100">
                      {PLACEMENT_LABELS[ad.placement] ?? ad.placement}
                    </span>
                    {isLive ? (
                      <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        配信中
                      </span>
                    ) : ad.isActive ? (
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full border border-yellow-100">
                        期間外
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100">
                        停止中
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                    {(ad.startDate || ad.endDate) && (
                      <span>
                        {ad.startDate ? toDateInput(ad.startDate) : "〜"} 〜 {ad.endDate ? toDateInput(ad.endDate) : "無期限"}
                      </span>
                    )}
                    <span>クリック: {ad.clicks}</span>
                    <span>CTR: {ctr}{ad.impressions > 0 ? "%" : ""}</span>
                    <span>優先度: {ad.sortOrder}</span>
                  </div>
                </div>

                {/* 操作 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(ad)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      ad.isActive
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                    }`}
                  >
                    {ad.isActive ? "停止" : "有効化"}
                  </button>
                  <button
                    onClick={() => openEdit(ad)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* モーダル */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {editingId ? "広告を編集" : "新規広告を作成"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タイトル（管理用）*</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="例: 〇〇株式会社 夏キャンペーン"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">企業名 *</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="例: 株式会社コマパラ"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">広告画像URL *</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/ad.png"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">リンク先URL *</label>
                  <input
                    type="url"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="https://example.com/landing"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">説明文（任意）</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="例: 詳しくはこちら"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">掲載場所</label>
                  <select
                    value={form.placement}
                    onChange={(e) => setForm({ ...form, placement: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="feed">フィード（トップページ）</option>
                    <option value="work">作品詳細ページ</option>
                    <option value="all">全ページ</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">掲載開始日</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">掲載終了日</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">優先度（大きいほど優先）</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-purple-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {form.isActive ? "有効（配信する）" : "無効（配信しない）"}
                  </span>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
