import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

const REASON_LABELS: Record<string, string> = {
  spam: "スパム・宣伝",
  inappropriate: "不適切なコンテンツ",
  copyright: "著作権侵害",
  other: "その他",
};

export default async function AdminReportsPage() {
  await requireAdmin();

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true } },
      reporter: { select: { name: true, email: true } },
    },
  });

  const pending = reports.filter((r) => r.status === "pending");
  const reviewed = reports.filter((r) => r.status !== "pending");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">通報一覧</h1>
        <span className="text-sm text-gray-500">未対応: {pending.length}件</span>
      </div>

      {pending.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">未対応の通報はありません</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-semibold text-red-600">未対応</h2>
          {pending.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400">対応済み</h2>
          {reviewed.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportRow({ report }: {
  report: {
    id: string;
    reason: string;
    detail: string | null;
    status: string;
    createdAt: Date;
    work: { id: string; title: string };
    reporter: { name: string | null; email: string | null };
  };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              report.status === "pending" ? "bg-red-100 text-red-600" :
              report.status === "reviewed" ? "bg-green-100 text-green-600" :
              "bg-gray-100 text-gray-500"
            }`}>
              {report.status === "pending" ? "未対応" : report.status === "reviewed" ? "対応済" : "却下"}
            </span>
            <span className="text-xs text-gray-500">{REASON_LABELS[report.reason] ?? report.reason}</span>
          </div>
          <Link href={`/work/${report.work.id}`} className="text-sm font-medium text-violet-600 hover:underline" target="_blank">
            {report.work.title}
          </Link>
          {report.detail && <p className="text-xs text-gray-500">{report.detail}</p>}
          <p className="text-xs text-gray-400">
            通報者: {report.reporter.name ?? report.reporter.email} ·{" "}
            {new Date(report.createdAt).toLocaleDateString("ja-JP")}
          </p>
        </div>

        {report.status === "pending" && (
          <div className="flex gap-2 shrink-0">
            <UpdateStatusButton reportId={report.id} status="reviewed" label="対応済" />
            <UpdateStatusButton reportId={report.id} status="dismissed" label="却下" />
          </div>
        )}
      </div>
    </div>
  );
}

function UpdateStatusButton({ reportId, status, label }: { reportId: string; status: string; label: string }) {
  return (
    <form action={`/api/admin/reports/${reportId}`} method="POST">
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
          status === "reviewed"
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
