export default function LeaderboardLoading() {
  return (
    <div className="container mx-auto py-4 px-4 animate-pulse page-fade-in">
      <div className="h-7 w-32 bg-muted rounded mb-6" />

      {/* Table skeleton */}
      <div className="rounded-lg border">
        <div className="h-10 bg-muted/50 border-b" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 border-b last:border-b-0 flex items-center px-4 gap-4">
            <div className="h-4 w-6 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-12 bg-muted rounded" />
            <div className="flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
