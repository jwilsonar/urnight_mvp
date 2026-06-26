import type { Ticket } from '../../../../modules/ticketing/domain/entities/ticket.entity';
import { TicketBuilder } from '../../builders/ticketing/ticket.builder';

/** Casos predefinidos de Ticket (máquina de estados de validación). */
export const TicketMother = {
  /** Ticket válido recién emitido. */
  valid: (): Ticket => new TicketBuilder().build(),
  /** Ticket ya usado (check-in previo). */
  used: (): Ticket => new TicketBuilder().buildUsed(),
  /** Ticket cancelado. */
  cancelled: (): Ticket => new TicketBuilder().buildCancelled(),
  /** Ticket expirado. */
  expired: (): Ticket => new TicketBuilder().buildExpired(),
};
