import { Skeleton } from "@urnight/ui";

export default function LocalDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 aspect-[16/9] w-full rounded-xl" />
      <Skeleton className="mb-2 h-9 w-1/2" />
      <Skeleton className="mb-8 h-4 w-1/3" />
      <Skeleton className="mb-8 h-40 w-full rounded-lg" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
