import { Inject, Injectable } from '@nestjs/common';
import type { TicketType } from '../../domain/entities/ticket-type.entity';
import {
  TICKET_TYPE_REPOSITORY,
  type TicketTypeRepository,
} from '../../domain/ports/ticket-type.repository';

/** Caso de uso (lectura pública): tipos de entrada de un evento. */
@Injectable()
export class ListTicketTypesUseCase {
  constructor(@Inject(TICKET_TYPE_REPOSITORY) private readonly ticketTypes: TicketTypeRepository) {}

  execute(eventId: string): Promise<TicketType[]> {
    return this.ticketTypes.listByEvent(eventId);
  }
}
