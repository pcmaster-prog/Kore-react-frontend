export default function TaskTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-neutral-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-5 animate-pulse"
        >
          {/* Avatar skeleton */}
          <div className="flex items-center gap-3 w-[180px] shrink-0">
            <div className="h-9 w-9 rounded-2xl bg-neutral-100" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 bg-neutral-100 rounded" />
              <div className="h-2.5 w-12 bg-neutral-100 rounded" />
            </div>
          </div>

          {/* Title skeleton */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="h-3.5 w-3/4 bg-neutral-100 rounded" />
            <div className="h-2.5 w-1/2 bg-neutral-100 rounded" />
          </div>

          {/* Status skeleton */}
          <div className="w-[100px] flex justify-center">
            <div className="h-6 w-16 bg-neutral-100 rounded-full" />
          </div>

          {/* Evidence skeleton */}
          <div className="w-[120px] flex justify-center">
            <div className="h-6 w-20 bg-neutral-100 rounded-full" />
          </div>

          {/* Actions skeleton */}
          <div className="w-[140px] flex justify-end gap-1.5">
            <div className="h-9 w-9 bg-neutral-100 rounded-xl" />
            <div className="h-9 w-9 bg-neutral-100 rounded-xl" />
            <div className="h-9 w-16 bg-neutral-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
