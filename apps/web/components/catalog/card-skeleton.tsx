import { Skeleton } from '@urnight/ui';

/** Grilla de skeletons para listados de catálogo. */
export function CatalogGridSkeleton({ count = 6, aspect = 'aspect-[4/3]' }: { count?: number; aspect?: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className={`w-full rounded-lg ${aspect}`} />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
