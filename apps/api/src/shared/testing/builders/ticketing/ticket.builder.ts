import { randomUUID } from 'node:crypto';
import { Ticket, type TicketProps } from '../../../../modules/ticketing/domain/entities/ticket.entity';

/**
 * Builder fluido para el aggregate Ticket. `build()` usa `Ticket.issue` (estado
 * 'valid'); `buildUsed()` / `buildCancelled()` reconstruyen estados para la
 * máquina de estados de validación.
 */
export class TicketBuilder {
  private id: string = randomUUID();
  private orderItemId = 'order-item-1';
  private eventId = 'event-1';
  private ticketTypeId = 'tt-1';
  private qrCode = 'qr-token-test';

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withOrderItem(orderItemId: string): this {
    this.orderItemId = orderItemId;
    return this;
  }

  withEvent(eventId: string): this {
    this.eventId = eventId;
    return this;
  }

  withTicketType(ticketTypeId: string): this {
    this.ticketTypeId = ticketTypeId;
    return this;
  }

  withQr(qrCode: string): this {
    this.qrCode = qrCode;
    return this;
  }

  build(): Ticket {
    return Ticket.issue({
      id: this.id,
      orderItemId: this.orderItemId,
      eventId: this.eventId,
      ticketTypeId: this.ticketTypeId,
      qrCode: this.qrCode,
    });
  }

  /** Reconstruye un ticket en un estado dado (para la máquina de estados). */
  private buildWith(props: Partial<TicketProps>): Ticket {
    return Ticket.fromPersistence({
      id: this.id,
      orderItemId: this.orderItemId,
      eventId: this.eventId,
      ticketTypeId: this.ticketTypeId,
      qrCode: this.qrCode,
      qrImageKey: null,
      status: 'valid',
      pdfUrl: null,
      issuedAt: new Date(),
      usedAt: null,
      ...props,
    });
  }

  buildUsed(): Ticket {
    return this.buildWith({ status: 'used', usedAt: new Date() });
  }

  buildCancelled(): Ticket {
    return this.buildWith({ status: 'cancelled' });
  }

  buildExpired(): Ticket {
    return this.buildWith({ status: 'expired' });
  }
}
