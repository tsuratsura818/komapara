import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function ServicePlanPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">サービス企画書</h1>
        <p className="text-gray-500">
          企画書は別タブで表示されます
        </p>
      </div>
      <Link
        href="/api/admin/service-plan"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        企画書を開く
      </Link>
    </div>
  );
}
