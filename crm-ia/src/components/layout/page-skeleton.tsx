import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

/** Esqueleto generico enquanto o bootstrap do workspace nao volta. */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-3 w-80" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-6 h-[220px] w-full rounded-lg" />
        </div>
        <div className="rounded-card border border-line bg-surface p-5">
          <Skeleton className="h-3 w-32" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
