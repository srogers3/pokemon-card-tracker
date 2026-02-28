export default function AdminLoading() {
  return (
    <div className="container mx-auto py-4 px-4 animate-pulse page-fade-in">
      <div className="h-7 w-32 bg-muted rounded mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg border bg-card mb-3" />
      ))}
    </div>
  );
}
