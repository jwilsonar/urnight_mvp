import type { SupportTicket } from '../../../../modules/ops/domain/entities/support-ticket.entity';
import type { SupportTicketRepository } from '../../../../modules/ops/domain/ports/ops.ports';
import { InMemoryRepository } from '../in-memory.repository';

/** SupportTicketRepository en memoria. Replica las operaciones del adapter Drizzle. */
export class InMemorySupportTicketRepository
  extends InMemoryRepository<SupportTicket>
  implements SupportTicketRepository
{
  /** Precarga un ticket sin pasar por `create` (datos de referencia). */
  seed(ticket: SupportTicket): this {
    this.put(ticket);
    return this;
  }

  async create(ticket: SupportTicket): Promise<SupportTicket> {
    this.put(ticket);
    return ticket;
  }

  async findById(id: string): Promise<SupportTicket | null> {
    return this.getById(id);
  }

  async update(ticket: SupportTicket): Promise<SupportTicket> {
    this.put(ticket);
    return ticket;
  }
}
