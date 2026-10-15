export default function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-hidden="true">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-10 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
