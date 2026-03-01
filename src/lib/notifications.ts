import webPush from "web-push";
import { prisma } from "./prisma";

const REACTION_LABELS: Record<string, string> = {
  like: "いいね",
  laugh: "笑った",
  cry: "泣いた",
  empathy: "共感",
  amazing: "すごい",
};

export function reactionLabel(type: string): string {
  return REACTION_LABELS[type] || "いいね";
}

let vapidConfigured = false;

try {
  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/=+$/, "");
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").replace(/=+$/, "");

  if (publicKey && privateKey) {
    webPush.setVapidDetails(
      "mailto:komapara@example.com",
      publicKey,
      privateKey
    );
    vapidConfigured = true;
  }
} catch {
  console.warn("VAPID keys are invalid or missing — push notifications disabled");
}

export type NotificationType =
  | "new_work"
  | "like"
  | "comment"
  | "follow"
  | "tip";

interface SendNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
}

/**
 * DB に通知レコードを作成し、Web Push を送信する
 */
export async function sendNotification(opts: SendNotificationOptions) {
  const { userId, type, title, body, link, imageUrl } = opts;

  // DB に通知レコード作成
  await prisma.notification.create({
    data: { userId, type, title, body, link, imageUrl },
  });

  // Push サブスクリプション取得
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0 || !vapidConfigured) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: link || "/",
    image: imageUrl,
  });

  // 並列送信（失敗したサブスクは削除）
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 410 Gone or 404 = 無効なサブスクリプション → 削除
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        }
      }
    })
  );
}

/**
 * フォロワー全員に通知を送信
 */
export async function notifyFollowers(
  authorId: string,
  authorName: string,
  workId: string,
  workTitle: string,
  thumbnailUrl?: string
) {
  // サイト設定でプッシュ通知が無効の場合はスキップ
  const setting = await prisma.siteSetting
    .findUnique({ where: { key: "push_notifications_enabled" } })
    .catch(() => null);
  if (setting?.value === "false") return;

  const followers = await prisma.follow.findMany({
    where: { followingId: authorId },
    select: { followerId: true },
  });

  if (followers.length === 0) return;

  await Promise.allSettled(
    followers.map((f) =>
      sendNotification({
        userId: f.followerId,
        type: "new_work",
        title: `${authorName}さんが新作を投稿`,
        body: workTitle,
        link: `/work/${workId}`,
        imageUrl: thumbnailUrl,
      })
    )
  );
}
