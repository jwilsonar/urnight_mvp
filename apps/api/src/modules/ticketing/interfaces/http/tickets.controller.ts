import { Controller, Get } from '@nestjs/common';
import type { TicketResponse } from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { ListMyTicketsUseCase } from '../../application/use-cases/list-my-tickets.use-case';
import { toTicketResponse } from './orders.controller';

/** Billetera de entradas del usuario. /api/v1/tickets. */
@Controller('tickets')
export class TicketsController {
  constructor(private readonly listMyTickets: ListMyTicketsUseCase) {}

  @Get('me')
  async mine(@CurrentUser() user: AuthUser): Promise<TicketResponse[]> {
    return (await this.listMyTickets.execute(user.id)).map((ut) =>
      toTicketResponse(ut.ticket, ut.attendeeName, ut.detail),
    );
  }
}
