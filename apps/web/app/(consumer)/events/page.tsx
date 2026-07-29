import { CalendarBlank, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@urnight/ui";
import { EventCard } from "@/components/catalog/event-card";
import { EventPriceFilter } from "@/components/catalog/event-price-filter";
import { ZoneFilter } from "@/components/catalog/zone-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import {
  getEvents,
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

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events.metadata");
  return { title: t("title"), description: t("description") };
}

const PAGE_SIZE = 24;

type EventsSearchParams = EventCatalogSearchParams;

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
  // La lista completa permite mostrar un recuento exacto sin cambiar el contrato.
  // Degrada con elegancia si el API no responde (evita romper el build ISR).
  const [events, genres, zones, tags] = await Promise.all([
    getEvents({
      q: filters.q,
      zoneId: filters.zoneId,
      genreId: filters.genreId,
      tagId: filters.tagId,
      from: filters.from,
      to: filters.to,
      minPrice,
      maxPrice,
    }).catch(() => null),
    getMusicGenres().catch(() => []),
    getZones().catch(() => []),
    getTags().catch(() => []),
  ]);

  const total = events?.length ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, lastPage);
  const hasNext = page < lastPage;
  const visible =
    events?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? null;

  /** Chips preservan la búsqueda activa; solo cambia el género (y resetea la página). */
  const chipHref = (genreId?: string) => {
    return eventCatalogHref("/events", filters, { genreId });
  };

  const datePresets: EventDatePreset[] = ["today", "tonight", "weekend"];
  const dateRangeNow = new Date();
  const dateHref = (preset?: EventDatePreset) => {
    if (!preset) {
      return eventCatalogHref("/events", filters, {
        datePreset: undefined,
        from: undefined,
        to: undefined,
      });
    }
    const range = getLimaDatePresetRange(preset, dateRangeNow);
    return eventCatalogHref("/events", filters, {
      datePreset: preset,
      from: range.from,
      to: range.to,
    });
  };

  const activeFilters: Array<{
    kind: "query" | "zone" | "genre" | "tag" | "date" | "price";
    label: string;
    href: string;
  }> = [];
  if (filters.q) {
    activeFilters.push({
      kind: "query",
      label: filters.q,
      href: eventCatalogHref("/events", filters, { q: undefined }),
    });
  }
  const selectedZone = zones.find((zone) => zone.id === filters.zoneId);
  if (filters.zoneId) {
    activeFilters.push({
      kind: "zone",
      label: selectedZone?.name ?? t("filters.zone.fallback"),
      href: eventCatalogHref("/events", filters, { zoneId: undefined }),
    });
  }
  const selectedGenre = genres.find((genre) => genre.id === filters.genreId);
  if (filters.genreId) {
    activeFilters.push({
      kind: "genre",
      label: selectedGenre?.name ?? t("filters.genre.fallback"),
      href: eventCatalogHref("/events", filters, { genreId: undefined }),
    });
  }
  const selectedTag = tags.find((tag) => tag.id === filters.tagId);
  if (filters.tagId) {
    activeFilters.push({
      kind: "tag",
      label: selectedTag?.name ?? t("filters.tagFallback"),
      href: eventCatalogHref("/events", filters, { tagId: undefined }),
    });
  }
  if (filters.from || filters.to) {
    const preset =
      filters.datePreset === "today" ||
      filters.datePreset === "tonight" ||
      filters.datePreset === "weekend"
        ? filters.datePreset
        : undefined;
    activeFilters.push({
      kind: "date",
      label: preset ? t(`filters.date.${preset}`) : t("filters.date.custom"),
      href: dateHref(),
    });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const label =
      minPrice !== undefined && maxPrice !== undefined
        ? `S/ ${minPrice}–${maxPrice}`
        : minPrice !== undefined
          ? `S/ ${minPrice}+`
          : `≤ S/ ${maxPrice}`;
    activeFilters.push({
      kind: "price",
      label,
      href: eventCatalogHref("/events", filters, {
        minPrice: undefined,
        maxPrice: undefined,
      }),
    });
  }
  const restrictiveOrder = ["price", "tag", "genre", "zone", "date", "query"];
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
          <Link href={eventCatalogHref("/events/calendar", filters)}>
            {t("calendarLink")}
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid gap-5 rounded-xl border border-border bg-card/40 p-4 lg:grid-cols-[14rem_1fr]">
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
          />
        </section>
        <section className="space-y-2" aria-labelledby="events-price-filter">
          <h2
            id="events-price-filter"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t("filters.price.title")}
          </h2>
          <EventPriceFilter
            key={`${filters.minPrice ?? ""}:${filters.maxPrice ?? ""}`}
          />
        </section>
      </div>

      <section className="mb-8 space-y-2" aria-labelledby="events-date-filter">
        <h2
          id="events-date-filter"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {t("filters.date.title")}
        </h2>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={dateHref()}
            className="rv-chip w-[10.5rem] justify-center"
            data-active={!filters.from && !filters.to}
          >
            {t("filters.date.any")}
          </Link>
          {datePresets.map((preset) => (
            <Link
              key={preset}
              href={dateHref(preset)}
              className="rv-chip w-[10.5rem] justify-center"
              data-active={filters.datePreset === preset}
            >
              {t(`filters.date.${preset}`)}
            </Link>
          ))}
        </div>
      </section>

      {genres.length > 0 ? (
        <section
          className="mb-8 space-y-2"
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
                <EventCard event={event} />
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
                  href={pageHref(filters, page - 1)}
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
                  href={pageHref(filters, page + 1)}
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
