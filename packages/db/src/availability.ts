import { sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { ticketHold } from './schema/checkout';

/** Fórmula única de cupo: capacidad - vendidos - holds activos no vencidos. */
export function availableCapacity(
  capacity: number,
  sold: number,
  activeHolds: number,
): number {
  return Math.max(capacity - sold - activeHolds, 0);
}

/** Versión SQL de la misma fórmula para filtrar y proyectar sin traer filas de más. */
export function availableCapacitySql(
  capacity: SQLWrapper,
  sold: SQLWrapper,
  activeHolds: SQLWrapper,
): SQL<number> {
  return sql<number>`greatest(${capacity} - ${sold} - ${activeHolds}, 0)::integer`;
}

/** Holds que ocupan un tipo de entrada en el instante indicado. */
export function activeTicketHoldQuantitySql(
  ticketTypeId: SQLWrapper,
  at: Date | SQL = sql`now()`,
): SQL<number> {
  const cutoff =
    at instanceof Date ? sql.param(at, ticketHold.expiresAt) : at;
  return sql<number>`coalesce((
    select sum(${ticketHold.quantity})::integer
    from ${ticketHold}
    where ${ticketHold.ticketTypeId} = ${ticketTypeId}
      and ${ticketHold.status} = 'active'
      and ${ticketHold.expiresAt} > ${cutoff}
  ), 0)::integer`;
}

/** Holds activos agregados del evento para el aforo de catálogo y ficha. */
export function activeEventHoldQuantitySql(
  eventId: SQLWrapper,
  at: Date | SQL = sql`now()`,
): SQL<number> {
  const cutoff =
    at instanceof Date ? sql.param(at, ticketHold.expiresAt) : at;
  return sql<number>`coalesce((
    select sum(${ticketHold.quantity})::integer
    from ${ticketHold}
    where ${ticketHold.eventId} = ${eventId}
      and ${ticketHold.status} = 'active'
      and ${ticketHold.expiresAt} > ${cutoff}
  ), 0)::integer`;
}
