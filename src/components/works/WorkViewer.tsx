"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { formatRelativeTime, buildWorkShareText, highResAvatar } from "@/lib/utils";
import { AdsenseUnit } from "@/components/ui/AdsenseUnit";
import { TipButton } from "./TipButton";
import { ReportButton } from "./ReportButton";

const REACTIONS = [
  { type: "like", emoji: "❤️", label: "いいね" },
  { type: "laugh", emoji: "😂", label: "笑った" },
  { type: "cry", emoji: "😢", label: "泣いた" },
  { type: "empathy", emoji: "🤝", label: "共感" },
  { type: "amazing", emoji: "✨", label: "すごい" },
] as const;

type Comment = {
  id: string;
  body: string;
  user: { id: string; name: string | null; image: string | null };
  createdAt: string;
};

type WorkDetail = {
  id: string;
  title: string;
  description: string | null;
  panels: string[];
  author: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    xHandle: string | null;
  };
  genres: { name: string; slug: string; emoji: string }[];
  likeCount: number;
  viewCount: number;
  commentCount: number;
  xPostUrl: string | null;
  createdAt: string;
  userReaction: string | null;
  reactionCounts: Record<string, number>;
  isFollowingAuthor: boolean;
  comments: Comment[];
};

export function WorkViewer({ work, tipsEnabled = true }: { work: WorkDetail; tipsEnabled?: boolean }) {
  const { data: session } = useSession();
  const isPremium = !!session?.user?.isPremium;
  const [userReaction, setUserReaction] = useState(work.userReaction);
  const [reactionCounts, setReactionCounts] = useState(work.reactionCounts);
  const [likeCount, setLikeCount] = useState(work.likeCount);
  const [following, setFollowing] = useState(work.isFollowingAuthor);
  const [isOwnWork, setIsOwnWork] = useState(false);
  const [comments, setComments] = useState(work.comments);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  // 閲覧計上（マウント時に1回だけビーコン送信。GETの副作用ではなくここに集約）
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    fetch(`/api/works/${work.id}/view`, { method: "POST", keepalive: true }).catch(
      () => {}
    );
  }, [work.id]);

  // ユーザー個別状態（自分のリアクション/フォロー/自作品か）をクライアントで取得
  // → ページ本体をISR(共有キャッシュ)化しても他人の状態が混ざらない
  useEffect(() => {
    if (!session?.user?.id) {
      setUserReaction(null);
      setFollowing(false);
      setIsOwnWork(false);
      return;
    }
    fetch(`/api/works/${work.id}/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setUserReaction(d.userReaction);
        setFollowing(d.isFollowingAuthor);
        setIsOwnWork(d.isOwnWork);
      })
      .catch(() => {});
  }, [session?.user?.id, work.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  const handleReaction = async (type: string) => {
    if (!session) return;
    setShowPicker(false);
    const res = await fetch(`/api/likes/${work.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: type }),
    });
    if (res.ok) {
      const data = await res.json();
      setUserReaction(data.userReaction);
      setReactionCounts(data.reactionCounts);
      setLikeCount(data.likeCount);
    }
  };

  const handleFollow = async () => {
    if (!session) return;
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/follows/${work.author.id}`, { method });
    if (res.ok) {
      setFollowing(!following);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${work.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentText }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentText("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shareText = () =>
    buildWorkShareText({
      title: work.title,
      authorName: work.author.name,
      authorXHandle: work.author.xHandle,
      genres: work.genres,
    });

  const handleShare = async () => {
    const url = `${window.location.origin}/work/${work.id}`;
    if (navigator.share) {
      await navigator.share({ title: `${work.title} - コマパラ`, text: shareText(), url });
    } else {
      await navigator.clipboard.writeText(`${shareText()}\n${url}`);
      alert("シェア用の文章をコピーしました");
    }
  };

  const handleShareToX = () => {
    const url = `${window.location.origin}/work/${work.id}`;
    const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(url)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  const currentReaction = REACTIONS.find((r) => r.type === userReaction);
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    // 誌面の枠（幅・白地・影）は作品ページ側が持つ。ここは中身だけ
    <div>
      {/* 見出し。パネルより先に置き、開いた瞬間に「何の作品か」が分かるようにする */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-komapara-text leading-tight">
          {work.title}
        </h1>
        {work.genres.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {work.genres.map((genre) => (
              <Link
                key={genre.slug}
                href={`/genre/${genre.slug}`}
                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 hover:bg-blue-100 transition-colors"
              >
                {genre.emoji} {genre.name}
              </Link>
            ))}
          </div>
        )}

        {/* 作家（署名）。誰の作品かを読む前に示す */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <Link href={`/creator/${work.author.id}`} className="flex items-center gap-2.5 min-w-0 group/author">
            {work.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={highResAvatar(work.author.image) as string}
                alt={work.author.name || ""}
                className="w-9 h-9 rounded-full ring-2 ring-blue-100 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium shrink-0">
                {work.author.name?.[0] || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-komapara-text truncate group-hover/author:text-accent transition-colors">
                {work.author.name}
              </p>
              <p className="text-xs text-komapara-muted">
                {new Date(work.createdAt).toLocaleDateString("ja-JP")}
              </p>
            </div>
          </Link>

          {session?.user?.id !== work.author.id && session && (
            <button
              onClick={handleFollow}
              className={`shrink-0 px-4 py-1.5 text-sm rounded-full font-medium transition-colors ${
                following
                  ? "text-komapara-muted bg-gray-100 hover:bg-gray-200"
                  : "text-white bg-accent hover:bg-blue-700"
              }`}
            >
              {following ? "フォロー中" : "フォロー"}
            </button>
          )}
        </div>
      </div>

      {/* 4コマビューワー。誌面と同じ白地に置き、作品の白余白と地続きにする。
          左右に余白を取り、コマが紙の端に着かないようにする */}
      <div className="bg-white px-[8%] sm:px-[10%]">
        {work.panels.map((panel, index) => (
          <div key={index} className="relative">
            <Image
              src={panel}
              alt={`${work.title} - ${index + 1}コマ目`}
              width={0}
              height={0}
              sizes="(max-width: 768px) 84vw, 614px"
              style={{ width: '100%', height: 'auto' }}
              priority={index === 0}
            />
            {/* ページの切れ目。白地に白の作品が続くので、淡い罫線で区切りだけ示す */}
            {index < work.panels.length - 1 && (
              <div className="h-px bg-gray-100" />
            )}
          </div>
        ))}
      </div>

      {/* 作品情報（見出しはパネル上に移設済み） */}
      <div className="px-4 py-4">
        {/* 説明・詳細（投稿時に入力した本文。改行を保持） */}
        {work.description && (
          <p className="text-sm leading-relaxed text-komapara-text/80 whitespace-pre-wrap break-words">
            {work.description}
          </p>
        )}

        {work.description && <div className="border-t border-komapara-border/50 my-3" />}

        {/* リアクション内訳 */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-1.5 mt-4 flex-wrap">
            {REACTIONS.map((r) => {
              const count = reactionCounts[r.type] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                    userReaction === r.type
                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                      : "glass text-komapara-muted hover:bg-gray-100"
                  }`}
                  disabled={!session}
                >
                  <span className="text-sm">{r.emoji}</span>
                  <span className="font-medium">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* アクションボタン（リアクション・投げ銭・シェアを1行に。狭い画面では折り返す） */}
        <div className="mt-3">
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => {
                  if (!session) return;
                  setShowPicker(!showPicker);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  userReaction
                    ? "bg-linear-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/25"
                    : "glass text-komapara-muted hover:text-pink-500"
                }`}
                disabled={!session}
              >
                <span className={`text-base ${userReaction ? "animate-heart-pop" : ""}`}>
                  {currentReaction?.emoji || "❤️"}
                </span>
                {currentReaction?.label || "リアクション"}{likeCount > 0 ? ` ${likeCount}` : ""}
              </button>

              {/* リアクションピッカー */}
              {showPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 p-2 rounded-2xl bg-white shadow-xl border border-komapara-border/50 animate-fade-in z-50">
                  {REACTIONS.map((r) => (
                    <button
                      key={r.type}
                      onClick={() => handleReaction(r.type)}
                      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all hover:scale-110 ${
                        userReaction === r.type
                          ? "bg-blue-100 ring-1 ring-blue-300"
                          : "hover:bg-gray-100"
                      }`}
                      title={r.label}
                    >
                      <span className="text-xl">{r.emoji}</span>
                      <span className="text-[10px] text-komapara-muted whitespace-nowrap">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <TipButton
              workId={work.id}
              authorId={work.author.id}
              authorName={work.author.name}
              tipsEnabled={tipsEnabled}
            />
            <button
              onClick={handleShareToX}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium glass text-komapara-muted hover:text-black transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Xでシェア
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium glass text-komapara-muted hover:text-blue-500 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              シェア
            </button>
          </div>
        </div>
      </div>

      {/* 広告 */}
      <div className="px-4 py-3">
        <AdsenseUnit slot="work-detail-1" isPremium={isPremium} />
      </div>

      {/* コメントセクション */}
      <div className="px-4 py-4 border-t border-komapara-border/50">
        <h2 className="text-sm font-semibold gradient-text mb-3">
          コメント ({work.commentCount})
        </h2>

        {/* コメント入力 */}
        {session ? (
          <form onSubmit={handleComment} className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="コメントを入力..."
              maxLength={500}
              className="flex-1 px-3 py-2 text-sm glass rounded-full focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition-all duration-200"
            >
              送信
            </button>
          </form>
        ) : (
          <p className="text-sm text-komapara-muted mb-4">
            <Link href="/login" className="gradient-text font-medium hover:underline">
              ログイン
            </Link>
            してコメントする
          </p>
        )}

        {/* コメント一覧 */}
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3"
            >
              {comment.user.image ? (
                <img
                  src={highResAvatar(comment.user.image) as string}
                  alt={comment.user.name || ""}
                  className="w-8 h-8 rounded-full shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-100 to-blue-100 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-komapara-text">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-komapara-muted">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-komapara-text mt-0.5">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-sm text-komapara-muted text-center py-4">
              まだコメントはありません
            </p>
          )}
        </div>
      </div>

      {/* 広告 */}
      <div className="px-4 py-3">
        <AdsenseUnit slot="work-detail-2" isPremium={isPremium} />
      </div>

      {/* 通報（ログイン時・自作品以外） */}
      {session?.user?.id && !isOwnWork && (
        <div className="px-4 pb-2 flex justify-end">
          <ReportButton workId={work.id} />
        </div>
      )}
    </div>
  );
}
