import type { Attendee } from '../../../../modules/ticketing/domain/entities/attendee.entity';
import type { Ticket } from '../../../../modules/ticketing/domain/entities/ticket.entity';
import type {
  IssuedTicket,
  TicketRepository,
  UserTicket,
} from '../../../../modules/ticketing/domain/ports/ticket.repository';

interface StoredTicket {
  ticket: Ticket;
  attendee: Attendee;
  userId: string | null;
}

/**
 * TicketRepository en memoria. Almacena tickets + asistentes (como el insert
 * conjunto del adapter Drizzle) y resuelve QR / billetera por usuario. El
 * dueño (userId) se asocia al emitir (`issueMany` con seam de `withOwner`) o se
 * precarga con `seed()` para los tests de billetera.
 */
export class InMemoryTicketRepository implements TicketRepository {
  private readonly entries: StoredTicket[] = [];
  /** Dueño a asignar a la próxima emisión (seam: el checkout no lo pasa). */
  private nextOwner: string | null = null;

  /** Estado actual (solo lectura) — útil para aserciones en los tests. */
  get all(): readonly StoredTicket[] {
    return [...this.entries];
  }

  get size(): number {
    return this.entries.length;
  }

  /** Fija el dueño que recibirán los tickets emitidos en el siguiente `issueMany`. */
  withOwner(userId: string): this {
    this.nextOwner = userId;
    return this;
  }

  /** Precarga un ticket de un usuario (billetera) sin pasar por el checkout. */
  seed(userId: string, ticket: Ticket, attendee: Attendee): this {
    this.entries.push({ ticket, attendee, userId });
    return this;
  }

  async issueMany(entries: IssuedTicket[], _tx: unknown): Promise<void> {
    const owner = this.nextOwner;
    for (const entry of entries) {
      this.entries.push({ ticket: entry.ticket, attendee: entry.attendee, userId: owner });
    }
    this.nextOwner = null;
  }

  async findByQr(qrCode: string): Promise<Ticket | null> {
    return this.entries.find((e) => e.ticket.qrCode === qrCode)?.ticket ?? null;
  }

  async listByUser(userId: string): Promise<UserTicket[]> {
    return this.entries
      .filter((e) => e.userId === userId)
      .map((e) => ({
        ticket: e.ticket,
        attendeeName: e.attendee.fullName,
        detail: {
          eventName: `Evento ${e.ticket.eventId}`,
          eventStartsAt: e.ticket.issuedAt,
          eventFlyerKey: null,
          venueName: null,
          ticketTypeName: `Tipo ${e.ticket.ticketTypeId}`,
        },
      }));
  }

  async update(ticket: Ticket, _tx?: unknown): Promise<void> {
    const entry = this.entries.find((e) => e.ticket.id === ticket.id);
    if (entry) entry.ticket = ticket;
  }

  async attachQrImage(ticketId: string, key: string): Promise<void> {
    const entry = this.entries.find((e) => e.ticket.id === ticketId);
    entry?.ticket.attachQrImage(key);
  }
}
