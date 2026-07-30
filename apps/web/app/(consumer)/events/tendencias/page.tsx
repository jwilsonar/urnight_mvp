import { TrendUp } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EventCard } from "@/components/catalog/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getLocals, getTrendingEvents } from "@/lib/api/catalog";
import { getEventCardPrices } from "@/lib/event-card-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events.trending.metadata");
  return { title: t("title"), description: t("description") };
}

/** Tendencias (#9): eventos más vendidos. Reusa getTrendingEvents + EventCard. */
export default async function TrendingEventsPage() {
  const t = await getTranslations("events.trending");
  const [events, locals] = await Promise.all([
    getTrendingEvents().catch(() => null),
    getLocals().catch(() => []),
  ]);
  const localById = new Map(locals.map((local) => [local.id, local]));
  const cardPrices = await getEventCardPrices(events ?? []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {events === null ? (
        <EmptyState
          icon={<TrendUp className="h-10 w-10" weight="duotone" />}
          title={t("loadError.title")}
          description={t("loadError.description")}
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<TrendUp className="h-10 w-10" weight="duotone" />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              local={localById.get(event.localId)}
              priceFrom={cardPrices.get(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
