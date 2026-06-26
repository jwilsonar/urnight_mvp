import type { TicketType } from '../../../../modules/events/domain/entities/ticket-type.entity';
import type { TicketTypeRepository } from '../../../../modules/events/domain/ports/ticket-type.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** TicketTypeRepository en memoria. Replica las búsquedas del adapter Drizzle. */
export class InMemoryTicketTypeRepository
  extends InMemoryRepository<TicketType>
  implements TicketTypeRepository
{
  async findById(id: string): Promise<TicketType | null> {
    return this.getById(id);
  }

  async listByEvent(eventId: string): Promise<TicketType[]> {
    return this.values().filter((t) => t.eventId === eventId);
  }

  async create(ticketType: TicketType): Promise<TicketType> {
    this.put(ticketType);
    return ticketType;
  }

  async update(ticketType: TicketType): Promise<TicketType> {
    this.put(ticketType);
    return ticketType;
  }
}
