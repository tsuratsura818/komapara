"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
        }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            予期しないエラーが発生しました
          </h1>
          <p style={{ color: "#6B7280", marginBottom: "1.5rem" }}>
            申し訳ありません。問題が発生しました。
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            もう一度試す
          </button>
        </div>
      </body>
    </html>
  );
}
