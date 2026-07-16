export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 w-48 bg-komapara-border/30 rounded-sm mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 text-center">
            <div className="h-8 w-16 mx-auto bg-komapara-border/30 rounded-sm mb-1" />
            <div className="h-3 w-12 mx-auto bg-komapara-border/20 rounded-sm" />
          </div>
        ))}
      </div>
      <div className="h-5 w-32 bg-komapara-border/30 rounded-sm mb-3" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl aspect-square bg-komapara-border/20" />
        ))}
      </div>
    </div>
  );
}
