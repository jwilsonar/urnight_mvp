import { CatalogGridSkeleton } from "@/components/catalog/card-skeleton";
import { Skeleton } from "@urnight/ui";

export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CatalogGridSkeleton aspect="aspect-video" />
    </div>
  );
}
