"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils";
import { WorkEditModal } from "./WorkEditModal";

type Props = {
  id: string;
  title: string;
  description: string | null;
  panels: string[];
  author: { id: string; name: string | null; image: string | null };
  genres: { name: string; slug: string; emoji: string }[];
  likeCount: number;
  createdAt: string;
};

export function DashboardWorkCard(props: Props) {
  const [editing, setEditing] = useState(false);
  const { id, title, panels, author, genres, likeCount, createdAt } = props;

  return (
    <>
      <div className="relative group/card">
        <Link href={`/work/${id}`} className="block">
          <div className="bg-komapara-card rounded-xl shadow-sm border border-komapara-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="aspect-square relative bg-gray-100 overflow-hidden">
              {panels[0] ? (
                <Image
                  src={panels[0]}
                  alt={`${title} - 1コマ目`}
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 16vw"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-3">
              {genres.length > 0 && (
                <div className="flex gap-1.5 mb-1.5">
                  {genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre.slug}
                      className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 text-purple-600 border border-purple-100/50"
                    >
                      {genre.emoji} {genre.name}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-komapara-text">
                {title}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 min-w-0">
                  {author.image ? (
                    <img
                      src={author.image}
                      alt={author.name || ""}
                      className="w-5 h-5 rounded-full flex-shrink-0 ring-1 ring-purple-200/50"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0" />
                  )}
                  <span className="text-sm text-komapara-muted truncate">{author.name}</span>
                </div>
                <div className="flex items-center gap-1 text-pink-500 flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="text-xs">{likeCount}</span>
                </div>
              </div>
              <p className="text-[11px] text-komapara-muted mt-1">
                {formatRelativeTime(createdAt)}
              </p>
            </div>
          </div>
        </Link>

        {/* 編集ボタン */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setEditing(true);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-komapara-muted hover:text-purple-600 opacity-0 group-hover/card:opacity-100 transition-all z-10"
          title="編集"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {editing && (
        <WorkEditModal
          work={{
            id,
            title,
            description: props.description,
            genres,
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
