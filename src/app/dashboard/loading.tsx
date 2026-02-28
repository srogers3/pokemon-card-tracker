export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl animate-pulse page-fade-in">
      <div className="h-7 w-40 bg-muted rounded mb-6" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-3 h-16" />
        ))}
      </div>

      {/* Button skeleton */}
      <div className="h-11 w-full bg-muted rounded-lg mb-6" />

      {/* Card skeleton */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="h-3 w-full bg-muted rounded" />
      </div>
    </div>
  );
}
