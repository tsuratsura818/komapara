"use client";

import { useEffect, useRef } from "react";

export function ServicePlanViewer({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const adjustHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc?.body) {
          iframe.style.height = doc.body.scrollHeight + "px";
        }
      } catch {
        // cross-origin の場合は無視
      }
    };

    iframe.addEventListener("load", adjustHeight);
    return () => iframe.removeEventListener("load", adjustHeight);
  }, []);

  return (
    <div className="w-full -m-4 md:-m-6">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="w-full border-0"
        style={{ minHeight: "100vh" }}
        title="サービス企画書"
      />
    </div>
  );
}
