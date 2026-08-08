import type { LocalOrderWindowResponse } from "@urnight/contracts";

const ORDER_TIME_ZONE = "America/Lima";

function timeToMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** Replica la ventana autoritativa del backend para anticipar el estado en UI. */
export function isWithinLocalOrderWindow(
  windows: readonly LocalOrderWindowResponse[],
  instant = new Date(),
): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ORDER_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdays[parts.weekday ?? ""];
  if (day === undefined) return false;
  const current = Number(parts.hour) * 60 + Number(parts.minute);

  return windows.some((window) => {
    const starts = timeToMinutes(window.startsAt);
    const ends = timeToMinutes(window.endsAt);
    if (starts < ends) {
      return window.dayOfWeek === day && current >= starts && current < ends;
    }
    return (
      (window.dayOfWeek === day && current >= starts) ||
      ((window.dayOfWeek + 1) % 7 === day && current < ends)
    );
  });
}

/** Convierte las ventanas a una línea corta y localizada para el asistente. */
export function formatLocalOrderWindows(
  windows: readonly LocalOrderWindowResponse[],
  locale: string,
): string {
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });

  return [...windows]
    .sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek || a.startsAt.localeCompare(b.startsAt),
    )
    .map((window) => {
      const day = weekday.format(
        new Date(Date.UTC(2023, 0, 1 + window.dayOfWeek)),
      );
      return `${day} ${window.startsAt.slice(0, 5)}–${window.endsAt.slice(0, 5)}`;
    })
    .join(", ");
}
