import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import { WorkActions } from "./WorkActions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "作品管理" };

export default async function AdminWorksPage(
  props: {
    searchParams: Promise<{ q?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.trim();
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.title = { contains: q, mode: "insensitive" };
  }

  const [works, totalCount] = await Promise.all([
    prisma.work.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
      },
    }).catch(() => []),
    prisma.work.count({ where }).catch(() => 0),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div>
      <h1 className="text-xl font-bold gradient-text mb-6">作品管理</h1>

      {/* 検索 */}
      <form className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="タイトルで検索..."
            className="flex-1 px-3 py-2 text-sm glass rounded-lg border border-komapara-border focus:outline-hidden focus:ring-2 focus:ring-gradient-purple/30"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            検索
          </button>
        </div>
      </form>

      <p className="text-xs text-komapara-muted mb-3">{totalCount}件の作品</p>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-komapara-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-komapara-muted">
                  作品
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-komapara-muted hidden md:table-cell">
                  作者
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  PV
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  いいね
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  コメント
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  状態
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  投稿日
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {works.map((work) => (
                <tr
                  key={work.id}
                  className="border-b border-komapara-border/50 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {work.panels[0] && (
                        <img
                          src={work.panels[0]}
                          alt=""
                          className="w-10 h-10 rounded-sm object-cover shrink-0"
                        />
                      )}
                      <p className="font-medium truncate max-w-[200px]">
                        {work.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-komapara-muted hidden md:table-cell">
                    {work.author.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {work.viewCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {work.likeCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {work._count.comments}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {work.isPublished ? (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                        公開
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        非公開
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-komapara-muted">
                    {formatRelativeTime(work.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <WorkActions
                      workId={work.id}
                      isPublished={work.isPublished}
                    />
                  </td>
                </tr>
              ))}
              {works.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-komapara-muted"
                  >
                    作品が見つかりません
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
              href={`/admin/works?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
