import type {
  AllocationDiscountType,
  PromoterAllocationProps,
  PromoterEvent,
} from '../entities/promoter-event.entity';

/** Detalle de cupo + descuento por tipo, con stock ya repartido (read-model). */
export interface AllocationView {
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  currency: string;
  discountType: AllocationDiscountType;
  discountValue: number;
  allocatedStock: number;
  /** Códigos ya generados (single-use → 1 por código). */
  usedStock: number;
  /** allocatedStock − usedStock. */
  remaining: number;
}

/** Vista de una asignación evento↔promotor con su evento y allocations. */
export interface AssignmentView {
  id: string;
  promoterId: string;
  eventId: string;
  status: 'active' | 'revoked';
  event: { id: string; slug: string; name: string; startsAt: Date; flyerUrl: string | null };
  items: AllocationView[];
  createdAt: Date;
}

/** Cabecera mínima para autorización (sin joins). */
export interface PromoterEventHeader {
  id: string;
  promoterId: string;
  eventId: string;
  status: 'active' | 'revoked';
}

/** Stock disponible (stock − vendidas) de un tipo de entrada del evento. */
export interface TicketStock {
  ticketTypeId: string;
  remaining: number;
}

/** Snapshot de una allocation para generar un código (con cupo restante). */
export interface AllocationSnapshot {
  promoterEventId: string;
  eventId: string;
  ticketTypeId: string;
  discountType: AllocationDiscountType;
  discountValue: number;
  allocatedStock: number;
  usedStock: number;
  remaining: number;
}

export interface PromoterEventRepository {
  /** Inserta la cabecera + sus allocations (en una Tx). */
  create(agg: PromoterEvent, tx?: unknown): Promise<void>;
  /** Borra la asignación (y por cascada sus allocations) para re-asignar. */
  deleteByPromoterAndEvent(promoterId: string, eventId: string, tx?: unknown): Promise<void>;
  /** Id de la asignación existente para (promotor, evento), o null. */
  findIdByPromoterAndEvent(promoterId: string, eventId: string): Promise<string | null>;
  /** Reemplaza las allocations de una asignación SIN borrar su cabecera (edición). */
  replaceAllocations(
    promoterEventId: string,
    allocations: PromoterAllocationProps[],
    tx?: unknown,
  ): Promise<void>;
  /** Stock disponible por tipo de entrada del evento (para acotar el cupo). */
  listTicketStocks(eventId: string): Promise<TicketStock[]>;
  findHeader(promoterEventId: string): Promise<PromoterEventHeader | null>;
  /** Asignaciones de un promotor (read-model con evento + allocations + remaining). */
  listViewsByPromoter(promoterId: string): Promise<AssignmentView[]>;
  findView(promoterEventId: string): Promise<AssignmentView | null>;
  getAllocation(promoterEventId: string, ticketTypeId: string): Promise<AllocationSnapshot | null>;
}

export const PROMOTER_EVENT_REPOSITORY = Symbol('PROMOTER_EVENT_REPOSITORY');
