"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { highResAvatar } from "@/lib/utils";

type Profile = {
  name: string | null;
  bio: string | null;
  image: string | null;
  xHandle: string | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
};

export function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial.name ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [xHandle, setXHandle] = useState(initial.xHandle ?? "");
  const [instagramHandle, setInstagramHandle] = useState(initial.instagramHandle ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl ?? "");
  const [image, setImage] = useState(initial.image ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/users/me/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "アップロードに失敗しました" });
        return;
      }
      setImage(data.url);
      setMessage({ type: "ok", text: "アイコンを変更しました" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, xHandle, instagramHandle, websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "保存に失敗しました" });
        return;
      }
      setMessage({ type: "ok", text: "プロフィールを保存しました" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm bg-white border border-komapara-border rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-blue-500/20 transition-all";

  return (
    <form onSubmit={handleSave} className="glass rounded-xl p-6 space-y-5">
      <h2 className="text-sm font-semibold text-komapara-text">プロフィール</h2>

      {/* アイコン */}
      <div className="flex items-center gap-4">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={highResAvatar(image) as string}
            alt="アイコン"
            className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-200/50"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
            {name?.[0] || "?"}
          </div>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatar}
            className="hidden"
            id="avatar-input"
          />
          <label
            htmlFor="avatar-input"
            className="inline-block px-3 py-1.5 text-xs font-medium text-accent bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
          >
            {uploading ? "アップロード中..." : "アイコンを変更"}
          </label>
          <p className="text-[11px] text-komapara-muted mt-1">JPEG / PNG / WebP・5MBまで</p>
        </div>
      </div>

      <div>
        <label htmlFor="p-name" className="block text-xs font-medium text-komapara-text mb-1">
          表示名
        </label>
        <input
          id="p-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="p-bio" className="block text-xs font-medium text-komapara-text mb-1">
          自己紹介
        </label>
        <textarea
          id="p-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="どんな4コマを描いているか、ひとことで"
          className={inputClass}
        />
        <p className="text-[11px] text-komapara-muted mt-1 text-right">{bio.length}/200</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-komapara-text">SNSリンク</h3>

        <div>
          <label htmlFor="p-x" className="block text-xs text-komapara-muted mb-1">X（旧Twitter）</label>
          <div className="flex items-center">
            <span className="px-3 py-2 text-sm text-komapara-muted bg-gray-50 border border-r-0 border-komapara-border rounded-l-lg">@</span>
            <input
              id="p-x"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="username"
              className={`${inputClass} rounded-l-none`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="p-ig" className="block text-xs text-komapara-muted mb-1">Instagram</label>
          <div className="flex items-center">
            <span className="px-3 py-2 text-sm text-komapara-muted bg-gray-50 border border-r-0 border-komapara-border rounded-l-lg">@</span>
            <input
              id="p-ig"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="username"
              className={`${inputClass} rounded-l-none`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="p-web" className="block text-xs text-komapara-muted mb-1">その他URL（サイト・ショップなど）</label>
          <input
            id="p-web"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className={inputClass}
          />
        </div>
      </div>

      {message && (
        <p className={`text-xs ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 text-sm font-semibold text-white bg-accent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
