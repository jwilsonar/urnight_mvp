import type { DomainEvent } from '../../../../shared/event-bus/domain-event';

/** Emitido al pagar una orden → atribución de ventas (ventana 7d), notificaciones. */
export interface OrderPaidPayload {
  orderId: string;
  userId: string;
  eventId: string;
  total: number;
  currency: string;
  paidAt: string;
  referralCode: string | null;
  holdIds: string[];
}

export class OrderPaidEvent implements DomainEvent<OrderPaidPayload> {
  readonly name = 'checkout.order_paid';
  readonly occurredAt = new Date();
  constructor(readonly payload: OrderPaidPayload) {}
}

/** Emitido al emitir una entrada → genera el PNG del QR (subscriber, fuera del use-case A8). */
export interface TicketIssuedPayload {
  ticketId: string;
  eventId: string;
  userId: string;
  /** Token del QR: la fuente para renderizar el PNG (A8: rendering fuera del checkout). */
  qrCode: string;
}

export class TicketIssuedEvent implements DomainEvent<TicketIssuedPayload> {
  readonly name = 'checkout.ticket_issued';
  readonly occurredAt = new Date();
  constructor(readonly payload: TicketIssuedPayload) {}
}
