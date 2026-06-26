import { Inject, Injectable } from '@nestjs/common';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { Event } from '../../domain/entities/event.entity';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

/**
 * Lectura admin: eventos de un local de MI empresa (TODOS los estados).
 * Aislado por tenant — el local debe pertenecer a la empresa del actor.
 */
@Injectable()
export class ListMyEventsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
  ) {}

  async execute(input: { localId: string; scope: TenantScope }): Promise<Event[]> {
    assertTenant(input.scope, await this.tenant.companyIdForLocal(input.localId));
    return this.events.listByLocal(input.localId);
  }
}
