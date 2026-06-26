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
}

export class OrderPaidEvent implements DomainEvent<OrderPaidPayload> {
  readonly name = 'checkout.order_paid';
  readonly occurredAt = new Date();
  constructor(readonly payload: OrderPaidPayload) {}
}

export class TicketIssuedEvent
  implements DomainEvent<{ ticketId: string; eventId: string; userId: string }>
{
  readonly name = 'checkout.ticket_issued';
  readonly occurredAt = new Date();
  constructor(readonly payload: { ticketId: string; eventId: string; userId: string }) {}
}
