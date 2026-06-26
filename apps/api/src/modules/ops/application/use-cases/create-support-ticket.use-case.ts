import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type { CreateSupportTicketDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { SupportTicket } from '../../domain/entities/support-ticket.entity';
import {
  SUPPORT_TICKET_REPOSITORY,
  type SupportTicketRepository,
} from '../../domain/ports/ops.ports';

/** Caso de uso: abrir ticket de soporte. */
@Injectable()
export class CreateSupportTicketUseCase {
  private readonly log = createLogger(CreateSupportTicketUseCase.name);

  constructor(
    @Inject(SUPPORT_TICKET_REPOSITORY) private readonly tickets: SupportTicketRepository,
  ) {}

  async execute(input: { dto: CreateSupportTicketDto; openedBy: string }): Promise<SupportTicket> {
    const ticket = SupportTicket.open({
      id: randomUUID(),
      ticketCode: `SUP-${randomBytes(3).toString('hex').toUpperCase()}`,
      openedBy: input.openedBy,
      localId: input.dto.localId ?? null,
      subject: input.dto.subject,
      description: input.dto.description ?? null,
      category: input.dto.category,
      priority: input.dto.priority,
    });
    const created = await this.tickets.create(ticket);
    this.log.info({ supportTicketId: created.id, userId: input.openedBy }, 'ops.support_ticket.created');
    return created;
  }
}
