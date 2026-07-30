import type { EventResponse } from "@urnight/contracts";
import { getEventTicketTypes } from "@/lib/api/catalog";

/**
 * Resuelve el precio mínimo real de cada evento sin inventar cifras cuando el
 * endpoint de entradas no está disponible. Las consultas comparten la caché
 * ISR del fetcher de catálogo.
 */
export async function getEventCardPrices(
  events: EventResponse[],
): Promise<Map<string, number | null>> {
  const unique = [
    ...new Map(events.map((event) => [event.id, event])).values(),
  ];
  const entries = await Promise.all(
    unique.map(async (event) => {
      const ticketTypes = await getEventTicketTypes(event.id).catch(() => []);
      const prices = ticketTypes
        .filter((ticketType) => ticketType.status !== "paused")
        .map((ticketType) => ticketType.price);

      return [
        event.id,
        prices.length > 0 ? Math.min(...prices) : null,
      ] as const;
    }),
  );

  return new Map(entries);
}
