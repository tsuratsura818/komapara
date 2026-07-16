"use client";

import { useRouter } from "next/navigation";
import { buildWorkShareText } from "@/lib/utils";

type Props = {
  workId: string;
  workTitle: string;
  coverImage?: string;
};

export function UploadComplete({ workId, workTitle, coverImage }: Props) {
  const router = useRouter();

  const handleShareToX = () => {
    const workUrl = `${window.location.origin}/work/${workId}`;
    // 自分の作品の投稿直後なので作家クレジット(@自分)は付けない
    const text = buildWorkShareText({ title: workTitle });
    const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(workUrl)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt={`${workTitle} 1コマ目`}
          className="w-40 mx-auto mb-4 rounded-xl border border-komapara-border/60 shadow-sm animate-scale-in"
        />
      ) : (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-main flex items-center justify-center text-white text-2xl animate-scale-in">
          &#10003;
        </div>
      )}
      <h1 className="text-xl font-bold text-komapara-text mb-2">投稿完了！</h1>
      <p className="text-sm text-komapara-muted mb-8">
        「{workTitle}」を投稿しました
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleShareToX}
          className="w-full py-3 text-white font-semibold bg-black rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Xでシェアする
        </button>

        <button
          onClick={() => router.push(`/work/${workId}`)}
          className="w-full py-3 text-white font-semibold bg-gradient-main rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          作品を見る
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full py-3 text-komapara-muted font-medium glass rounded-xl hover:bg-gray-100 transition-colors"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
