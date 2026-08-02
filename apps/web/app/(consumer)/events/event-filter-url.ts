import type { EventCatalogSearchParams } from "@/lib/catalog-filters";

export type EventsSearchParams = EventCatalogSearchParams & {
  date?: string;
  genreIds?: string;
  tagIds?: string;
};

const FILTER_KEYS = [
  "q",
  "zoneId",
  "genreId",
  "genreIds",
  "tagId",
  "tagIds",
  "from",
  "to",
  "datePreset",
  "minPrice",
  "maxPrice",
] as const satisfies ReadonlyArray<keyof EventsSearchParams>;

/** Normaliza la query CSV y conserva los enlaces singulares retrocompatibles. */
export function selectedFilterIds(csv?: string, singular?: string): string[] {
  const values = [...(csv?.split(",") ?? []), singular]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return [...new Set(values)];
}

export function filterIdsCsv(ids: readonly string[]): string | undefined {
  return ids.length > 0 ? ids.join(",") : undefined;
}

export function toggleFilterId(ids: readonly string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter((selectedId) => selectedId !== id)
    : [...ids, id];
}

/** Construye una URL de eventos preservando los filtros CSV y reseteando página. */
export function eventFiltersHref(
  pathname: "/events" | "/events/calendar",
  current: EventsSearchParams,
  updates: Partial<EventsSearchParams> = {},
): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = Object.hasOwn(updates, key) ? updates[key] : current[key];
    if (value) params.set(key, value);
  }
  if (updates.page && updates.page !== "1") {
    params.set("page", updates.page);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
