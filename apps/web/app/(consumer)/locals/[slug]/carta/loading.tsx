import { ForkKnife } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@urnight/ui";

export default async function CartaLoading() {
  const t = await getTranslations("carta.load");

  return (
    <div
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label={t("localLoading")}
    >
      <ForkKnife aria-hidden="true" className="size-6 text-muted-foreground" />
      <Skeleton className="h-10 w-3/4 max-w-lg motion-reduce:animate-none" />
      <Skeleton className="h-5 w-64 motion-reduce:animate-none" />
      <Skeleton className="h-10 w-full motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="aspect-[3/4] motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
