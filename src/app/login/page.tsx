import Link from "next/link";
import Image from "next/image";
import { LoginButtons } from "@/components/auth/LoginButtons";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

/**
 * ログインページ。
 * 青ベタ一色はヘッダーの青と溶けて階層が消え、かつ4コマのサイトなのに
 * 作品が1つも映っていなかった。価値の源泉は作品なので、文字で説明せず実物を見せる。
 * 地は誌面と同じ柄にして、サイトの他の面と地続きにする。
 */
export default async function LoginPage() {
  const works = await prisma.work.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, title: true, panels: true },
  });

  return (
    <div className="relative px-4 py-10 sm:py-14">
      <div className="fixed inset-0 -z-10 reading-bg" aria-hidden="true" />

      <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-center">
        {/* ログイン */}
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div className="text-center lg:text-left mb-6">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-komapara-text">コマパラ</h1>
            </Link>
            <p className="mt-1.5 text-sm text-komapara-muted">
              4コマ漫画が集まるポータル
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_28px_rgba(15,23,42,0.13)] ring-1 ring-black/5">
            <h2 className="text-base font-bold text-komapara-text text-center mb-5">
              ログイン / 新規登録
            </h2>
            <LoginButtons />
            <p className="mt-4 text-xs text-komapara-muted text-center leading-relaxed">
              ログインすると
              <Link href="/terms" className="text-accent font-medium hover:underline">
                利用規約
              </Link>
              と
              <Link href="/privacy" className="text-accent font-medium hover:underline">
                プライバシーポリシー
              </Link>
              に同意したとみなされます
            </p>
          </div>

          {/* 読むだけなら登録は要らない。正当な出口として示す */}
          <div className="mt-5 flex flex-col items-center lg:items-start gap-2">
            <Link href="/" className="text-sm font-medium text-accent hover:underline">
              ログインせずに読む →
            </Link>
            <Link
              href="/about"
              className="text-xs text-komapara-muted hover:text-komapara-text transition-colors"
            >
              コマパラについて
            </Link>
          </div>
        </div>

        {/* 何が読めるのかを、作品そのもので示す */}
        {works.length > 0 && (
          <div className="hidden lg:block">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-1 h-5 rounded-full bg-accent shrink-0" aria-hidden="true" />
              <p className="text-sm font-bold text-komapara-text">いま読める作品</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {works.map((w) => (
                <Link
                  key={w.id}
                  href={`/work/${w.id}`}
                  className="group block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/5] bg-white border-b border-gray-100">
                    {w.panels[0] && (
                      <Image
                        src={w.panels[0]}
                        alt={w.title}
                        fill
                        sizes="180px"
                        className="object-contain"
                      />
                    )}
                  </div>
                  <p className="px-2 py-1.5 text-[11px] font-medium text-komapara-text truncate">
                    {w.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
