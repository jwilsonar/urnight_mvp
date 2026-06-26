import { Inject, Injectable } from '@nestjs/common';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { Event } from '../../domain/entities/event.entity';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

/**
 * Lectura admin: detalle de un evento de MI empresa por id (cualquier estado).
 * Aislado por tenant — nunca devuelve un evento de otra empresa.
 */
@Injectable()
export class GetMyEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
  ) {}

  async execute(input: { eventId: string; scope: TenantScope }): Promise<Event> {
    const event = await this.events.findById(input.eventId);
    if (!event) throw new EventNotFoundError();
    assertTenant(input.scope, await this.tenant.companyIdForLocal(event.localId));
    return event;
  }
}
