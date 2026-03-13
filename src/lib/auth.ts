import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}
if (process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET) {
  providers.push(
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      // プレミアム状態を取得（期限チェック付き）
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isPremium: true, premiumExpiry: true },
      });
      session.user.isPremium =
        (dbUser?.isPremium && dbUser?.premiumExpiry && new Date(dbUser.premiumExpiry) > new Date()) ?? false;
      return session;
    },
  },
  events: {
    // 新規ユーザー作成時: CreatorOutreachのステータスを自動更新
    async createUser({ user }) {
      try {
        // Xログインの場合、Accountからusernameを取得
        const account = await prisma.account.findFirst({
          where: { userId: user.id, provider: "twitter" },
        });
        // ユーザーのxHandleまたはTwitter Account情報で突合
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { xHandle: true, name: true },
        });
        const xHandle = dbUser?.xHandle || (account ? user.name : null);
        if (xHandle) {
          // xHandleの@なし版でCreatorOutreachを検索
          const handle = xHandle.replace(/^@/, "");
          await prisma.creatorOutreach.updateMany({
            where: {
              xHandle: handle,
              status: { notIn: ["登録済み", "見送り"] },
            },
            data: { status: "登録済み" },
          });
        }
      } catch {
        // 突合失敗は無視（メイン認証フローをブロックしない）
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});
