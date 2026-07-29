export type EventDatePreset = "today" | "tonight" | "weekend";

export interface EventCatalogSearchParams {
  q?: string;
  zoneId?: string;
  genreId?: string;
  tagId?: string;
  from?: string;
  to?: string;
  datePreset?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
}

const EVENT_FILTER_KEYS = [
  "q",
  "zoneId",
  "genreId",
  "tagId",
  "from",
  "to",
  "datePreset",
  "minPrice",
  "maxPrice",
] as const;

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Construye una URL de catálogo preservando filtros y reseteando la página. */
export function eventCatalogHref(
  pathname: string,
  current: EventCatalogSearchParams,
  updates: Partial<EventCatalogSearchParams> = {},
): string {
  const params = new URLSearchParams();
  for (const key of EVENT_FILTER_KEYS) {
    const value = Object.hasOwn(updates, key) ? updates[key] : current[key];
    if (value) params.set(key, value);
  }
  if (updates.page && updates.page !== "1") params.set("page", updates.page);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function parsePriceFilter(value?: string): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function limaDateToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0,
  millisecond = 0,
): Date {
  return new Date(
    Date.UTC(year, monthIndex, day, hour, minute, second, millisecond) +
      LIMA_OFFSET_MS,
  );
}

function localParts(now: Date) {
  const lima = new Date(now.getTime() - LIMA_OFFSET_MS);
  return {
    year: lima.getUTCFullYear(),
    monthIndex: lima.getUTCMonth(),
    day: lima.getUTCDate(),
    weekday: lima.getUTCDay(),
    hour: lima.getUTCHours(),
  };
}

/**
 * Rangos del negocio en America/Lima (UTC-5, sin horario de verano):
 * - today: día calendario local completo.
 * - tonight: desde ahora hasta el próximo cierre nocturno de las 06:00.
 * - weekend: viernes 18:00 a lunes 06:00; si ya empezó, desde ahora.
 */
export function getLimaDatePresetRange(
  preset: EventDatePreset,
  now = new Date(),
): { from: string; to: string } {
  const { year, monthIndex, day, weekday, hour } = localParts(now);

  if (preset === "today") {
    return {
      from: limaDateToUtc(year, monthIndex, day, 0).toISOString(),
      to: limaDateToUtc(year, monthIndex, day, 23, 59, 59, 999).toISOString(),
    };
  }

  if (preset === "tonight") {
    const endDayOffset = hour < 6 ? 0 : 1;
    return {
      from: now.toISOString(),
      to: limaDateToUtc(year, monthIndex, day + endDayOffset, 6).toISOString(),
    };
  }

  const isCurrentWeekend =
    (weekday === 5 && hour >= 18) ||
    weekday === 6 ||
    weekday === 0 ||
    (weekday === 1 && hour < 6);
  const fridayOffset = isCurrentWeekend
    ? weekday === 0
      ? -2
      : weekday === 1
        ? -3
        : 5 - weekday
    : (5 - weekday + 7) % 7;
  const start = limaDateToUtc(year, monthIndex, day + fridayOffset, 18);
  const end = limaDateToUtc(year, monthIndex, day + fridayOffset + 3, 6);

  return {
    from: now > start ? now.toISOString() : start.toISOString(),
    to: end.toISOString(),
  };
}
