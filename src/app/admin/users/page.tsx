import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import { UserActions } from "./UserActions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ユーザー管理" };

export default async function AdminUsersPage(
  props: {
    searchParams: Promise<{ q?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.trim();
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isCreator: true,
        isBanned: true,
        createdAt: true,
        _count: { select: { works: true, comments: true } },
      },
    }).catch(() => []),
    prisma.user.count({ where }).catch(() => 0),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div>
      <h1 className="text-xl font-bold gradient-text mb-6">ユーザー管理</h1>

      {/* 検索 */}
      <form className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="名前・メールで検索..."
            className="flex-1 px-3 py-2 text-sm glass rounded-lg border border-komapara-border focus:outline-hidden focus:ring-2 focus:ring-gradient-purple/30"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            検索
          </button>
        </div>
      </form>

      <p className="text-xs text-komapara-muted mb-3">{totalCount}件のユーザー</p>

      {/* テーブル */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-komapara-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-komapara-muted">
                  ユーザー
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-komapara-muted hidden md:table-cell">
                  メール
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  作品
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  コメント
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  状態
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  登録日
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-komapara-muted">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-komapara-border/50 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-komapara-muted">
                          ?
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name || "名前未設定"}</p>
                        {user.isCreator && (
                          <span className="text-xs text-gradient-purple">
                            クリエイター
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-komapara-muted hidden md:table-cell">
                    {user.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">{user._count.works}</td>
                  <td className="px-4 py-3 text-center">{user._count.comments}</td>
                  <td className="px-4 py-3 text-center">
                    {user.isBanned ? (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                        BAN
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                        有効
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-komapara-muted">
                    {formatRelativeTime(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <UserActions userId={user.id} isBanned={user.isBanned} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-komapara-muted">
                    ユーザーが見つかりません
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
              href={`/admin/users?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
