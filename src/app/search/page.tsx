"use client";

import { useState } from "react";
import { WorkCard } from "@/components/works/WorkCard";
import Link from "next/link";

type SearchWork = {
  id: string;
  title: string;
  panels: string[];
  author: { id: string; name: string | null; image: string | null };
  tags: { name: string; slug: string; emoji: string }[];
  likeCount: number;
  createdAt: string;
};

type SearchCreator = {
  id: string;
  name: string | null;
  image: string | null;
  xHandle: string | null;
  _count: { works: number; followers: number };
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"works" | "creators">("works");
  const [works, setWorks] = useState<SearchWork[]>([]);
  const [creators, setCreators] = useState<SearchCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${type}`
      );
      const data = await res.json();
      if (type === "works") {
        setWorks(data.works || []);
        setCreators([]);
      } else {
        setCreators(data.creators || []);
        setWorks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードで検索..."
            className="flex-1 px-4 py-2.5 border border-komapara-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            検索
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => setType("works")}
            className={`text-sm px-3 py-1 rounded-full ${
              type === "works"
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-komapara-muted"
            }`}
          >
            作品
          </button>
          <button
            type="button"
            onClick={() => setType("creators")}
            className={`text-sm px-3 py-1 rounded-full ${
              type === "creators"
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-komapara-muted"
            }`}
          >
            作家
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-10 text-komapara-muted">検索中...</div>
      )}

      {!loading && searched && type === "works" && (
        <>
          {works.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {works.map((work) => (
                <WorkCard
                  key={work.id}
                  id={work.id}
                  title={work.title}
                  panels={work.panels}
                  author={work.author}
                  genres={work.tags}
                  likeCount={work.likeCount}
                  createdAt={work.createdAt}
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-komapara-muted">
              「{query}」に一致する作品が見つかりません
            </p>
          )}
        </>
      )}

      {!loading && searched && type === "creators" && (
        <>
          {creators.length > 0 ? (
            <div className="space-y-3">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/creator/${creator.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-komapara-border p-3 hover:shadow-sm transition-shadow"
                >
                  {creator.image ? (
                    <img
                      src={creator.image}
                      alt={creator.name || ""}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100" />
                  )}
                  <div>
                    <p className="font-medium text-komapara-text">
                      {creator.name}
                    </p>
                    {creator.xHandle && (
                      <p className="text-xs text-komapara-muted">
                        @{creator.xHandle}
                      </p>
                    )}
                    <p className="text-xs text-komapara-muted">
                      {creator._count.works}作品 ・{" "}
                      {creator._count.followers}フォロワー
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-komapara-muted">
              「{query}」に一致する作家が見つかりません
            </p>
          )}
        </>
      )}
    </div>
  );
}
