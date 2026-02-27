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
            className="flex-1 px-4 py-2.5 glass rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-main text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
          >
            検索
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => setType("works")}
            className={`text-sm px-3 py-1 rounded-full transition-all duration-200 ${
              type === "works"
                ? "bg-gradient-main text-white shadow-sm"
                : "glass text-komapara-muted"
            }`}
          >
            作品
          </button>
          <button
            type="button"
            onClick={() => setType("creators")}
            className={`text-sm px-3 py-1 rounded-full transition-all duration-200 ${
              type === "creators"
                ? "bg-gradient-main text-white shadow-sm"
                : "glass text-komapara-muted"
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
              {works.map((work, index) => (
                <div
                  key={work.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
                >
                  <WorkCard
                    id={work.id}
                    title={work.title}
                    panels={work.panels}
                    author={work.author}
                    genres={work.tags}
                    likeCount={work.likeCount}
                    createdAt={work.createdAt}
                  />
                </div>
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
              {creators.map((creator, index) => (
                <Link
                  key={creator.id}
                  href={`/creator/${creator.id}`}
                  className="flex items-center gap-3 glass rounded-xl p-3 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
                >
                  {creator.image ? (
                    <img
                      src={creator.image}
                      alt={creator.name || ""}
                      className="w-12 h-12 rounded-full ring-2 ring-purple-200/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100" />
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
