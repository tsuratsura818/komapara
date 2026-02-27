"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-xl p-6 max-w-lg w-full text-center space-y-4">
        <h2 className="text-xl font-bold text-red-400">エラーが発生しました</h2>
        <p className="text-sm text-komapara-muted break-all">
          {error.message}
        </p>
        {error.digest && (
          <p className="text-xs text-komapara-muted">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-gradient-main text-white rounded-lg text-sm"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
