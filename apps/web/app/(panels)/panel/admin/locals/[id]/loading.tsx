import { Skeleton } from '@urnight/ui';

export default function LocalDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-56 w-full rounded-lg" />
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
