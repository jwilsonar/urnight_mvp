import { CatalogGridSkeleton } from '@/components/catalog/card-skeleton';
import { Skeleton } from '@urnight/ui';

export default function LocalsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-56" />
      </div>
      <CatalogGridSkeleton />
    </div>
  );
}
