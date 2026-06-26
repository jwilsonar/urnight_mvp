import { Inject, Injectable } from '@nestjs/common';
import {
  TICKET_REPOSITORY,
  type TicketRepository,
  type UserTicket,
} from '../../domain/ports/ticket.repository';

/** Caso de uso: billetera del usuario (sus entradas). */
@Injectable()
export class ListMyTicketsUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository) {}

  execute(userId: string): Promise<UserTicket[]> {
    return this.tickets.listByUser(userId);
  }
}
