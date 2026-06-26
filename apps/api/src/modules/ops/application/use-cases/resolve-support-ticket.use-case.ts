import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { ResolveSupportTicketDto } from '@urnight/contracts';
import type { SupportTicket } from '../../domain/entities/support-ticket.entity';
import { SupportTicketNotFoundError } from '../../domain/errors/ops.errors';
import {
  SUPPORT_TICKET_REPOSITORY,
  type SupportTicketRepository,
} from '../../domain/ports/ops.ports';

/** Caso de uso: cambiar estado de un ticket de soporte (super_admin). */
@Injectable()
export class ResolveSupportTicketUseCase {
  private readonly log = createLogger(ResolveSupportTicketUseCase.name);

  constructor(
    @Inject(SUPPORT_TICKET_REPOSITORY) private readonly tickets: SupportTicketRepository,
  ) {}

  async execute(input: { ticketId: string; dto: ResolveSupportTicketDto }): Promise<SupportTicket> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket) {
      this.log.warn({ supportTicketId: input.ticketId }, 'ops.support_ticket.not_found');
      throw new SupportTicketNotFoundError();
    }
    ticket.changeStatus(input.dto.status);
    const updated = await this.tickets.update(ticket);
    this.log.info({ supportTicketId: updated.id }, 'ops.support_ticket.resolved');
    return updated;
  }
}
