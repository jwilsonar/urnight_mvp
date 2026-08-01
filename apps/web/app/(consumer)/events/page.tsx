import { CalendarBlank, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@urnight/ui";
import { EventCard } from "@/components/catalog/event-card";
import { ZoneFilter } from "@/components/catalog/zone-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import {
  getEventsPage,
  getLocals,
  getMusicGenres,
  getTags,
  getZones,
} from "@/lib/api/catalog";
import {
  eventCatalogHref,
  getLimaDatePresetRange,
  parsePriceFilter,
  type EventCatalogSearchParams,
  type EventDatePreset,
} from "@/lib/catalog-filters";
import { getEventCardPrices } from "@/lib/event-card-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events.metadata");
  return { title: t("title"), description: t("description") };
}

const PAGE_SIZE = 24;

type EventsSearchParams = EventCatalogSearchParams & { date?: string };

/** Href de una página conservando los filtros activos (compatible con ISR). */
function pageHref(filters: EventsSearchParams, page: number): string {
  return eventCatalogHref("/events", filters, {
    page: page > 1 ? String(page) : undefined,
  });
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<EventsSearchParams>;
}) {
  const t = await getTranslations("events");
  const filters = await searchParams;
  const requestedPage = Math.max(
    1,
    Number.parseInt(filters.page ?? "1", 10) || 1,
  );
  const minPrice = parsePriceFilter(filters.minPrice);
  const maxPrice = parsePriceFilter(filters.maxPrice);
  const requestedDatePreset = filters.datePreset ?? filters.date;
  const datePreset: EventDatePreset | undefined =
    requestedDatePreset === "tonight"
      ? "today"
      : requestedDatePreset === "today" || requestedDatePreset === "weekend"
        ? requestedDatePreset
        : undefined;
  const hrefFilters = { ...filters, datePreset };
  const dateRange = datePreset
    ? getLimaDatePresetRange(datePreset)
    : { from: filters.from, to: filters.to };
  const [events, genres, zones, tags, locals] = await Promise.all([
    getEventsPage({
      q: filters.q,
      zoneId: filters.zoneId,
      genreId: filters.genreId,
      tagId: filters.tagId,
      from: dateRange.from,
      to: dateRange.to,
      minPrice,
      maxPrice,
      limit: PAGE_SIZE,
      offset: (requestedPage - 1) * PAGE_SIZE,
    }).catch(() => null),
    getMusicGenres().catch(() => []),
    getZones().catch(() => []),
    getTags().catch(() => []),
    getLocals().catch(() => []),
  ]);

  const total = events?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = requestedPage;
  const hasNext = page < lastPage;
  const visible = events?.events ?? null;
  const localById = new Map(locals.map((local) => [local.id, local]));
  const cardPrices = await getEventCardPrices(visible ?? []);

  /** Chips preservan la búsqueda activa; solo cambia el género (y resetea la página). */
  const chipHref = (genreId?: string) => {
    return eventCatalogHref("/events", hrefFilters, { genreId });
  };

  const datePresets: EventDatePreset[] = ["today", "weekend"];
  const dateHref = (preset?: EventDatePreset) => {
    if (!preset) {
      return eventCatalogHref("/events", hrefFilters, {
        datePreset: undefined,
        from: undefined,
        to: undefined,
      });
    }
    return eventCatalogHref("/events", hrefFilters, {
      datePreset: preset,
      from: undefined,
      to: undefined,
    });
  };

  const activeFilters: Array<{
    kind: "query" | "zone" | "genre" | "tag" | "date";
    label: string;
    href: string;
  }> = [];
  if (filters.q) {
    activeFilters.push({
      kind: "query",
      label: filters.q,
      href: eventCatalogHref("/events", hrefFilters, { q: undefined }),
    });
  }
  const selectedZone = zones.find((zone) => zone.id === filters.zoneId);
  if (filters.zoneId) {
    activeFilters.push({
      kind: "zone",
      label: selectedZone?.name ?? t("filters.zone.fallback"),
      href: eventCatalogHref("/events", hrefFilters, { zoneId: undefined }),
    });
  }
  const selectedGenre = genres.find((genre) => genre.id === filters.genreId);
  if (filters.genreId) {
    activeFilters.push({
      kind: "genre",
      label: selectedGenre?.name ?? t("filters.genre.fallback"),
      href: eventCatalogHref("/events", hrefFilters, { genreId: undefined }),
    });
  }
  const selectedTag = tags.find((tag) => tag.id === filters.tagId);
  if (filters.tagId) {
    activeFilters.push({
      kind: "tag",
      label: selectedTag?.name ?? t("filters.tagFallback"),
      href: eventCatalogHref("/events", hrefFilters, { tagId: undefined }),
    });
  }
  if (datePreset || filters.from || filters.to) {
    activeFilters.push({
      kind: "date",
      label: datePreset
        ? t(`filters.date.${datePreset}`)
        : t("filters.date.custom"),
      href: dateHref(),
    });
  }
  const restrictiveOrder = ["tag", "genre", "zone", "date", "query"];
  const suggestedFilter = restrictiveOrder
    .map((kind) => activeFilters.find((filter) => filter.kind === kind))
    .find(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        {/* La búsqueda vive en el header (con sugerencias); aquí solo el modo calendario. */}
        <Button variant="secondary" size="sm" asChild>
          <Link href={eventCatalogHref("/events/calendar", hrefFilters)}>
            {t("calendarLink")}
          </Link>
        </Button>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card/40 p-4 sm:p-5">
        <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start">
          <section className="space-y-2" aria-labelledby="events-zone-filter">
            <h2
              id="events-zone-filter"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("filters.zone.title")}
            </h2>
            <ZoneFilter
              zones={zones}
              pathname="/events"
              ariaLabel={t("filters.zone.aria")}
              allLabel={t("filters.zone.all")}
              className="sm:w-48"
            />
          </section>

          {/* Filtro de precio oculto por decisión de producto; el componente se conserva. */}

          <section className="space-y-2" aria-labelledby="events-date-filter">
            <h2
              id="events-date-filter"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("filters.date.title")}
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              <Link
                href={dateHref()}
                className="rv-chip w-full justify-center sm:w-[10.5rem]"
                data-active={!datePreset && !filters.from && !filters.to}
              >
                {t("filters.date.any")}
              </Link>
              {datePresets.map((preset) => (
                <Link
                  key={preset}
                  href={dateHref(preset)}
                  className="rv-chip w-full justify-center sm:w-[10.5rem]"
                  data-active={datePreset === preset}
                >
                  {t(`filters.date.${preset}`)}
                </Link>
              ))}
            </div>
          </section>

          {genres.length > 0 ? (
            <section
              className="space-y-2 lg:col-span-2"
              aria-labelledby="events-genre-filter"
            >
              <h2
                id="events-genre-filter"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {t("filters.genre.title")}
              </h2>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href={chipHref()}
                  className="rv-chip w-[5.8125rem] justify-center"
                  data-active={!filters.genreId}
                >
                  <Sparkle className="size-4" weight="duotone" /> {t("all")}
                </Link>
                {genres.map((g) => (
                  <Link
                    key={g.id}
                    href={chipHref(g.id)}
                    className="rv-chip"
                    data-active={filters.genreId === g.id}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <section
          className="mb-6 space-y-3"
          aria-labelledby="active-event-filters"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="active-event-filters" className="text-sm font-semibold">
              {t("active.title")}
            </h2>
            <Link href="/events" className="rv-chip w-36 justify-center">
              {t("active.clearAll")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Link
                key={filter.kind}
                href={filter.href}
                className="rv-chip w-44 max-w-full justify-between"
                aria-label={t("active.remove", { filter: filter.label })}
              >
                <span className="truncate">{filter.label}</span>
                <span aria-hidden="true">×</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {visible !== null ? (
        <p className="mb-5 text-sm text-muted-foreground" role="status">
          {t("results", { count: total })}
        </p>
      ) : null}

      {visible === null ? (
        <EmptyState
          icon={<CalendarBlank className="h-10 w-10" weight="duotone" />}
          title={t("loadError.title")}
          description={t("loadError.description")}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CalendarBlank className="h-10 w-10" weight="duotone" />}
          title={
            activeFilters.length > 0
              ? t("empty.filteredTitle")
              : t("empty.title")
          }
          description={
            suggestedFilter
              ? t("empty.filteredDescription", {
                  filter: suggestedFilter.label,
                })
              : t("empty.description")
          }
          action={
            <Button asChild className="w-56 max-w-full">
              <Link href={suggestedFilter?.href ?? "/locals"}>
                {suggestedFilter
                  ? t("empty.removeFilter", { filter: suggestedFilter.label })
                  : t("empty.action")}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((event, i) => (
              <Reveal key={event.id} delay={(i % 3) * 80}>
                <EventCard
                  event={event}
                  local={localById.get(event.localId)}
                  priceFrom={cardPrices.get(event.id)}
                />
              </Reveal>
            ))}
          </div>

          {page > 1 || hasNext ? (
            <nav
              aria-label={t("pagination.aria")}
              className="mt-10 flex items-center justify-center gap-6"
            >
              {page > 1 ? (
                <Link
                  href={pageHref(hrefFilters, page - 1)}
                  className="text-sm text-rose hover:underline"
                >
                  ← {t("pagination.previous")}
                </Link>
              ) : null}
              <span className="text-sm text-muted-foreground">
                {t("pagination.page", { page })}
              </span>
              {hasNext ? (
                <Link
                  href={pageHref(hrefFilters, page + 1)}
                  className="text-sm text-rose hover:underline"
                >
                  {t("pagination.next")} →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
