import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import { CommentActions } from "./CommentActions";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "コメント管理" };

export default async function AdminCommentsPage(
  props: {
    searchParams: Promise<{ page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const [comments, totalCount] = await Promise.all([
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, image: true } },
        work: { select: { id: true, title: true } },
      },
    }).catch(() => []),
    prisma.comment.count().catch(() => 0),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div>
      <h1 className="text-xl font-bold gradient-text mb-6">コメント管理</h1>
      <p className="text-xs text-komapara-muted mb-3">{totalCount}件のコメント</p>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-komapara-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-komapara-muted">
                  ユーザー
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-komapara-muted">
                  コメント
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-komapara-muted hidden md:table-cell">
                  作品
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  日時
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr
                  key={comment.id}
                  className="border-b border-komapara-border/50 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {comment.user.image ? (
                        <img
                          src={comment.user.image}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-komapara-muted">
                          ?
                        </div>
                      )}
                      <span className="font-medium text-sm">
                        {comment.user.name || "名前未設定"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-2 max-w-[300px]">
                      {comment.body}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Link
                      href={`/work/${comment.work.id}`}
                      className="text-gradient-purple hover:underline truncate block max-w-[200px]"
                    >
                      {comment.work.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-komapara-muted whitespace-nowrap">
                    {formatRelativeTime(comment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CommentActions commentId={comment.id} />
                  </td>
                </tr>
              ))}
              {comments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-komapara-muted"
                  >
                    コメントはありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/comments?page=${p}`}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                p === page
                  ? "bg-gradient-main text-white"
                  : "glass text-komapara-muted hover:text-komapara-text"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
