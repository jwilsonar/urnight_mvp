import { Skeleton } from '@urnight/ui';

export default function SuperAdminSettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
