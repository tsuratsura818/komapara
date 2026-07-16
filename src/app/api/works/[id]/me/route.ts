import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * 作品詳細ページのユーザー個別状態を返す（クライアントから取得）。
 * 作品詳細ページ本体をISR(共有キャッシュ)化するため、
 * 個別状態(自分のリアクション/フォロー/自作品か)はここに分離する。
 */
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const empty = { userReaction: null, isFollowingAuthor: false, isOwnWork: false };

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(empty);

  const work = await prisma.work.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!work) return NextResponse.json(empty);

  const isOwnWork = work.authorId === session.user.id;
  const [like, follow] = await Promise.all([
    prisma.like.findUnique({
      where: { userId_workId: { userId: session.user.id, workId: id } },
      select: { reaction: true },
    }),
    isOwnWork
      ? Promise.resolve(null)
      : prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: work.authorId,
            },
          },
        }),
  ]);

  return NextResponse.json({
    userReaction: like?.reaction ?? null,
    isFollowingAuthor: !!follow,
    isOwnWork,
  });
}
