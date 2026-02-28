export default function CollectionLoading() {
  return (
    <div className="container mx-auto py-4 px-4 animate-pulse page-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="h-6 w-28 bg-muted rounded-full" />
      </div>

      {/* Progress bar skeleton */}
      <div className="w-full bg-muted rounded-full h-3 mb-6" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-muted/30 border border-dashed border-border" />
        ))}
      </div>
    </div>
  );
}
