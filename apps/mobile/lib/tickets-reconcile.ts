import type { TicketResponse } from '@urnight/contracts';

/**
 * Qué escribir y qué borrar de la copia local tras una respuesta del backend
 * (SD-06 fase 3). La copia local NUNCA decide: todo lo que llega se sobrescribe
 * y todo lo que no llega se borra.
 */
export function reconcileTickets(
  cachedIds: string[],
  fresh: TicketResponse[],
): { upsert: TicketResponse[]; deleteIds: string[] } {
  const freshIds = new Set(fresh.map((t) => t.id));
  return {
    upsert: fresh,
    deleteIds: cachedIds.filter((id) => !freshIds.has(id)),
  };
}
