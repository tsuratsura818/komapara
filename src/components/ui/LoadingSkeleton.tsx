export function WorkGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden glass">
          <div className="aspect-square skeleton-shimmer" />
          <div className="p-3 space-y-2">
            <div className="h-3 skeleton-shimmer rounded-sm w-1/3" />
            <div className="h-4 skeleton-shimmer rounded-sm" />
            <div className="h-3 skeleton-shimmer rounded-sm w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900">
        <div className="aspect-3/4 skeleton-shimmer" />
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="h-6 skeleton-shimmer rounded-sm w-2/3" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full skeleton-shimmer" />
          <div className="space-y-1">
            <div className="h-4 skeleton-shimmer rounded-sm w-24" />
            <div className="h-3 skeleton-shimmer rounded-sm w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 py-6">
      <div className="h-7 skeleton-shimmer rounded-sm w-40 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 text-center">
            <div className="h-8 skeleton-shimmer rounded-sm w-16 mx-auto" />
            <div className="h-3 skeleton-shimmer rounded-sm w-12 mx-auto mt-2" />
          </div>
        ))}
      </div>
      <WorkGridSkeleton count={4} />
    </div>
  );
}

export function RankingSkeleton() {
  return (
    <div>
      <div className="bg-gradient-main px-4 py-6 text-white rounded-b-2xl">
        <div className="h-7 bg-white/20 rounded-sm w-48" />
        <div className="h-4 bg-white/10 rounded-sm w-32 mt-2" />
      </div>
      <div className="px-4 py-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 glass rounded-xl p-3">
            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
            <div className="w-14 h-14 rounded-lg skeleton-shimmer" />
            <div className="flex-1 space-y-1">
              <div className="h-4 skeleton-shimmer rounded-sm w-2/3" />
              <div className="h-3 skeleton-shimmer rounded-sm w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="h-7 skeleton-shimmer rounded-sm w-48" />
      <div className="h-4 skeleton-shimmer rounded-sm w-full" />
      <div className="h-4 skeleton-shimmer rounded-sm w-3/4" />
      <WorkGridSkeleton count={6} />
    </div>
  );
}
