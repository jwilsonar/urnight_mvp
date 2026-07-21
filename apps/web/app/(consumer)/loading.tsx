import { Skeleton } from "@urnight/ui";

export default function ConsumerLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full max-w-2xl" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
