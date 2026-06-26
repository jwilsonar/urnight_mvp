import type { Attendee } from '../entities/attendee.entity';
import type { Ticket } from '../entities/ticket.entity';

export interface IssuedTicket {
  ticket: Ticket;
  attendee: Attendee;
}

/** Detalle del evento de un ticket (para la billetera /tickets/me). */
export interface TicketEventDetail {
  eventName: string;
  eventStartsAt: Date;
  eventFlyerKey: string | null;
  venueName: string | null;
  ticketTypeName: string;
}

export interface UserTicket {
  ticket: Ticket;
  attendeeName: string;
  detail: TicketEventDetail;
}

export interface TicketRepository {
  /** Inserta tickets + asistentes (en la Tx del checkout). */
  issueMany(entries: IssuedTicket[], tx: unknown): Promise<void>;
  findByQr(qrCode: string): Promise<Ticket | null>;
  listByUser(userId: string): Promise<UserTicket[]>;
  update(ticket: Ticket, tx?: unknown): Promise<void>;
  /** Persiste la key S3 del PNG del QR (tras generarlo, fuera de la Tx). */
  attachQrImage(ticketId: string, key: string): Promise<void>;
}

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');
