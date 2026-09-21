import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level fallback. Mirrors the shape of a catalogue page so the
 * transition is a fill-in rather than a flash of empty canvas.
 */
export default function Loading() {
  return (
    <div className="shell pt-32 sm:pt-40" aria-busy aria-label="Carregando">
      <div className="flex max-w-2xl flex-col gap-5 pb-14">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
