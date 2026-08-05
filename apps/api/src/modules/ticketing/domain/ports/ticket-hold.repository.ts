import type { TicketHold } from '../entities/ticket-hold.entity';

export interface TicketHoldRepository {
  create(hold: TicketHold, tx?: unknown): Promise<TicketHold>;
  findById(id: string, tx?: unknown): Promise<TicketHold | null>;
  findByIdForUpdate(id: string, tx: unknown): Promise<TicketHold | null>;
  update(hold: TicketHold, tx?: unknown): Promise<TicketHold>;
  availableCapacity(ticketTypeId: string, at: Date, tx?: unknown): Promise<number>;
  expireStale(at: Date, tx?: unknown): Promise<number>;
}

export const TICKET_HOLD_REPOSITORY = Symbol('TICKET_HOLD_REPOSITORY');
