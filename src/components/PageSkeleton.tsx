// src/components/PageSkeleton.tsx
/**
 * Skeleton / shimmer placeholder que se muestra mientras
 * se carga un chunk de ruta con React.lazy().
 */
export default function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-2">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-2xl bg-neutral-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-48 rounded-xl bg-neutral-200" />
          <div className="h-3 w-32 rounded-xl bg-neutral-100" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-neutral-100 border border-neutral-200/50" />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-40 rounded-xl bg-neutral-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-neutral-100 border border-neutral-200/50"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
