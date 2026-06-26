import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateTicketTypeDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { TicketType } from '../../domain/entities/ticket-type.entity';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';
import {
  TICKET_TYPE_REPOSITORY,
  type TicketTypeRepository,
} from '../../domain/ports/ticket-type.repository';

/** Caso de uso: crear tipo de entrada para un evento (admin_local del local dueño). */
@Injectable()
export class CreateTicketTypeUseCase {
  private readonly log = createLogger(CreateTicketTypeUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
    @Inject(TICKET_TYPE_REPOSITORY) private readonly ticketTypes: TicketTypeRepository,
  ) {}

  async execute(input: { dto: CreateTicketTypeDto; scope: TenantScope }): Promise<TicketType> {
    const dto = input.dto;
    this.log.debug({ eventId: dto.eventId }, 'events.ticket_type.started');
    const event = await this.events.findById(dto.eventId);
    if (!event) {
      this.log.warn({ eventId: dto.eventId }, 'events.event.not_found');
      throw new EventNotFoundError();
    }
    assertTenant(input.scope, await this.tenant.companyIdForLocal(event.localId));
    const ticketType = TicketType.create({
      id: randomUUID(),
      eventId: dto.eventId,
      name: dto.name,
      tierCode: dto.tierCode,
      price: dto.price,
      currency: dto.currency,
      stock: dto.stock,
      maxPerUser: dto.maxPerUser ?? null,
      saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : null,
      saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null,
    });
    const saved = await this.ticketTypes.create(ticketType);
    this.log.info({ ticketTypeId: saved.id, eventId: saved.eventId }, 'events.ticket_type.created');
    return saved;
  }
}
