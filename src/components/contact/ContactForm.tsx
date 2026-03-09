"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "general", label: "一般的なお問い合わせ" },
  { value: "bug", label: "不具合の報告" },
  { value: "feature", label: "機能要望" },
  { value: "account", label: "アカウントについて" },
  { value: "other", label: "その他" },
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), category, message: message.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "送信に失敗しました");
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      setErrorMsg("通信エラーが発生しました");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-3">&#x2709;&#xFE0F;</div>
        <p className="text-lg font-bold text-gray-900 mb-2">送信完了しました</p>
        <p className="text-sm text-gray-500">
          お問い合わせありがとうございます。<br />
          返信までに数日かかる場合がございます。
        </p>
        <button
          onClick={() => {
            setName("");
            setEmail("");
            setCategory("general");
            setMessage("");
            setStatus("idle");
          }}
          className="mt-6 text-sm text-violet-600 hover:underline"
        >
          新しいお問い合わせを送る
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
          お名前 <span className="text-red-400">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          placeholder="山田太郎"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス <span className="text-red-400">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          maxLength={200}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          placeholder="example@email.com"
        />
      </div>

      <div>
        <label htmlFor="contact-category" className="block text-sm font-medium text-gray-700 mb-1">
          カテゴリ
        </label>
        <select
          id="contact-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
          お問い合わせ内容 <span className="text-red-400">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y"
          placeholder="お問い合わせ内容を入力してください"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{message.length} / 2000</p>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-violet-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "sending" ? "送信中..." : "送信する"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        返信までに数日かかる場合があります。あらかじめご了承ください。
      </p>
    </form>
  );
}
