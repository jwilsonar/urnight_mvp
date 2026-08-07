import {
  CalendarBlank,
  CaretDown,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Fragment } from "react";
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
  getLimaDatePresetRange,
  parsePriceFilter,
  type EventDatePreset,
} from "@/lib/catalog-filters";
import { getEventCardPrices } from "@/lib/event-card-data";
import {
  eventFiltersHref,
  filterIdsCsv,
  selectedFilterIds,
  toggleFilterId,
  type EventsSearchParams,
} from "./event-filter-url";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events.metadata");
  return { title: t("title"), description: t("description") };
}

const PAGE_SIZE = 24;

/** Href de una página conservando los filtros activos (compatible con ISR). */
function pageHref(filters: EventsSearchParams, page: number): string {
  return eventFiltersHref("/events", filters, {
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
  const selectedGenreIds = selectedFilterIds(filters.genreIds, filters.genreId);
  const selectedTagIds = selectedFilterIds(filters.tagIds, filters.tagId);
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
      genreId: filters.genreIds ? undefined : filters.genreId,
      genreIds: filters.genreIds ? selectedGenreIds : undefined,
      tagId: filters.tagIds ? undefined : filters.tagId,
      tagIds: filters.tagIds ? selectedTagIds : undefined,
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

  /** Los chips concretos alternan ids CSV; "Todos" limpia ambos formatos. */
  const genreHref = (genreId?: string) => {
    const nextIds = genreId ? toggleFilterId(selectedGenreIds, genreId) : [];
    return eventFiltersHref("/events", hrefFilters, {
      genreId: undefined,
      genreIds: filterIdsCsv(nextIds),
    });
  };
  const tagHref = (tagId?: string) => {
    const nextIds = tagId ? toggleFilterId(selectedTagIds, tagId) : [];
    return eventFiltersHref("/events", hrefFilters, {
      tagId: undefined,
      tagIds: filterIdsCsv(nextIds),
    });
  };

  const datePresets: EventDatePreset[] = ["today", "weekend"];
  const dateHref = (preset?: EventDatePreset) => {
    if (!preset) {
      return eventFiltersHref("/events", hrefFilters, {
        datePreset: undefined,
        from: undefined,
        to: undefined,
      });
    }
    return eventFiltersHref("/events", hrefFilters, {
      datePreset: preset,
      from: undefined,
      to: undefined,
    });
  };

  const activeFilters: Array<{
    key: string;
    kind: "query" | "zone" | "genre" | "tag" | "date";
    label: string;
    href: string;
  }> = [];
  if (filters.q) {
    activeFilters.push({
      key: "query",
      kind: "query",
      label: filters.q,
      href: eventFiltersHref("/events", hrefFilters, { q: undefined }),
    });
  }
  const selectedZone = zones.find((zone) => zone.id === filters.zoneId);
  if (filters.zoneId) {
    activeFilters.push({
      key: "zone",
      kind: "zone",
      label: selectedZone?.name ?? t("filters.zone.fallback"),
      href: eventFiltersHref("/events", hrefFilters, { zoneId: undefined }),
    });
  }
  for (const genreId of selectedGenreIds) {
    const selectedGenre = genres.find((genre) => genre.id === genreId);
    activeFilters.push({
      key: `genre-${genreId}`,
      kind: "genre",
      label: selectedGenre?.name ?? t("filters.genre.fallback"),
      href: genreHref(genreId),
    });
  }
  for (const tagId of selectedTagIds) {
    const selectedTag = tags.find((tag) => tag.id === tagId);
    activeFilters.push({
      key: `tag-${tagId}`,
      kind: "tag",
      label: selectedTag?.name ?? t("filters.tagFallback"),
      href: tagHref(tagId),
    });
  }
  if (datePreset || filters.from || filters.to) {
    activeFilters.push({
      key: "date",
      kind: "date",
      label: datePreset
        ? t(`filters.date.${datePreset}`)
        : t("filters.date.custom"),
      href: dateHref(),
    });
  }
  const hasActiveMultiFilters =
    selectedGenreIds.length > 0 || selectedTagIds.length > 0;
  const partialMatchIndex = hasActiveMultiFilters
    ? (visible?.findIndex((event) => !event.matchesAll) ?? -1)
    : -1;
  const showPartialMatchSeparator = partialMatchIndex > 0;

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
          <Link href={eventFiltersHref("/events/calendar", hrefFilters)}>
            {t("calendarLink")}
          </Link>
        </Button>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card/40 p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-center">
          <section className="space-y-2" aria-labelledby="events-zone-filter">
            <h2
              id="events-zone-filter"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("filters.zone.title")}
            </h2>
            <div className="flex min-h-[46px] items-center">
              <ZoneFilter
                zones={zones}
                pathname="/events"
                ariaLabel={t("filters.zone.aria")}
                allLabel={t("filters.zone.all")}
                className="h-[46px] sm:w-48"
              />
            </div>
          </section>

          {/* Filtro de precio oculto por decisión de producto; el componente se conserva. */}

          <section className="space-y-2" aria-labelledby="events-date-filter">
            <h2
              id="events-date-filter"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("filters.date.title")}
            </h2>
            <div className="grid min-h-[46px] grid-cols-2 items-center gap-2.5 sm:flex sm:flex-wrap">
              <Link
                href={dateHref()}
                className="rv-chip h-[46px] w-full justify-center sm:w-[10.5rem]"
                data-active={!datePreset && !filters.from && !filters.to}
              >
                {t("filters.date.any")}
              </Link>
              {datePresets.map((preset) => (
                <Link
                  key={preset}
                  href={dateHref(preset)}
                  className="rv-chip h-[46px] w-full justify-center sm:w-[10.5rem]"
                  data-active={datePreset === preset}
                >
                  {t(`filters.date.${preset}`)}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {genres.length > 0 || tags.length > 0 ? (
          <details
            className="group mt-5 border-t border-border pt-4"
            open={selectedGenreIds.length > 0 || selectedTagIds.length > 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>
                <span className="block text-sm font-semibold">
                  {t("filters.more.title")}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t("filters.more.description")}
                </span>
              </span>
              <CaretDown
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <div className="mt-5 grid gap-6 xl:grid-cols-2">
              {genres.length > 0 ? (
                <section
                  className="space-y-2"
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
                      href={genreHref()}
                      className="rv-chip min-w-24 justify-center"
                      data-active={selectedGenreIds.length === 0}
                    >
                      <Sparkle className="size-4" weight="duotone" /> {t("all")}
                    </Link>
                    {genres.map((genre) => (
                      <Link
                        key={genre.id}
                        href={genreHref(genre.id)}
                        className="rv-chip"
                        data-active={selectedGenreIds.includes(genre.id)}
                      >
                        {genre.name}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {tags.length > 0 ? (
                <section
                  className="space-y-2"
                  aria-labelledby="events-tag-filter"
                >
                  <h2
                    id="events-tag-filter"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {t("filters.tags.title")}
                  </h2>
                  <div className="flex flex-wrap gap-2.5">
                    <Link
                      href={tagHref()}
                      className="rv-chip min-w-24 justify-center"
                      data-active={selectedTagIds.length === 0}
                    >
                      <Sparkle className="size-4" weight="duotone" /> {t("all")}
                    </Link>
                    {tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={tagHref(tag.id)}
                        className="rv-chip"
                        data-active={selectedTagIds.includes(tag.id)}
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>

      {/* Se listaban los filtros activos como chips, duplicando lo que los
          propios controles ya muestran marcados en rojo. Queda solo "limpiar
          todo", que sí ahorra trabajo: apagarlos de a uno es tedioso. */}
      {activeFilters.length > 0 ? (
        <div className="mb-6 flex justify-end">
          <Link href="/events" className="rv-chip w-36 justify-center">
            {t("active.clearAll")}
          </Link>
        </div>
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
            activeFilters.length > 0
              ? t("empty.restrictiveDescription")
              : t("empty.description")
          }
          action={
            <Button asChild className="w-56 max-w-full">
              <Link href={activeFilters.length > 0 ? "/events" : "/locals"}>
                {activeFilters.length > 0
                  ? t("active.clearAll")
                  : t("empty.action")}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((event, i) => (
              <Fragment key={event.id}>
                {showPartialMatchSeparator && i === partialMatchIndex ? (
                  <div className="border-t border-border pt-5 sm:col-span-2 lg:col-span-3">
                    <p className="text-sm font-semibold">
                      {t("partialMatches.title")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("partialMatches.description")}
                    </p>
                  </div>
                ) : null}
                <Reveal delay={(i % 3) * 80}>
                  <EventCard
                    event={event}
                    local={localById.get(event.localId)}
                    priceFrom={cardPrices.get(event.id)}
                  />
                </Reveal>
              </Fragment>
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
