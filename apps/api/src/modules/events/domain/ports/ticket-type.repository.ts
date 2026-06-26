import type { TicketType } from '../entities/ticket-type.entity';

export interface TicketTypeRepository {
  findById(id: string): Promise<TicketType | null>;
  listByEvent(eventId: string): Promise<TicketType[]>;
  create(ticketType: TicketType): Promise<TicketType>;
  update(ticketType: TicketType): Promise<TicketType>;
}

export const TICKET_TYPE_REPOSITORY = Symbol('TICKET_TYPE_REPOSITORY');
