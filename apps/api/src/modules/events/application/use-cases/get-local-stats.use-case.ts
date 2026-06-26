import { Inject, Injectable } from '@nestjs/common';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

export interface LocalStats {
  eventsCount: number;
  publishedCount: number;
  ticketsSold: number;
  checkins: number;
}

/**
 * KPIs de un local de MI empresa (#19/#22). CQRS-lite: agrega contadores
 * denormalizados de EVENT (ticketsSold/checkinsCount). Aislado por tenant.
 */
@Injectable()
export class GetLocalStatsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
  ) {}

  async execute(input: { localId: string; scope: TenantScope }): Promise<LocalStats> {
    assertTenant(input.scope, await this.tenant.companyIdForLocal(input.localId));
    const events = await this.events.listByLocal(input.localId);
    return {
      eventsCount: events.length,
      publishedCount: events.filter((e) => e.status === 'published').length,
      ticketsSold: events.reduce((acc, e) => acc + e.ticketsSold, 0),
      checkins: events.reduce((acc, e) => acc + e.checkinsCount, 0),
    };
  }
}
