"use client";

export default function WorkError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">
          エラーが発生しました
        </h2>
        <p className="text-komapara-muted text-sm mb-6">
          作品の読み込みに失敗しました。時間をおいて再度お試しください。
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
