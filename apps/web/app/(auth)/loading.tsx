import { Skeleton } from '@urnight/ui';

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6">
      <Skeleton className="mx-auto h-8 w-32" />
      <Skeleton className="mx-auto h-5 w-56" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
