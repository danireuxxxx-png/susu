import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("ts-skeleton rounded-md", className)}
      aria-hidden
    />
  );
}

/** Matches the real card's geometry exactly, so nothing shifts on swap. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-elevated p-5">
      <Skeleton className="aspect-[4/5] w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
