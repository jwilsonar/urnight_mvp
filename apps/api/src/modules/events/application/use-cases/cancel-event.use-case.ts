import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import type { Event } from '../../domain/entities/event.entity';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { EventCancelledEvent } from '../../domain/events/events.events';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

/** Caso de uso: cancelar evento (admin_local del local dueño). Emite EventCancelled. */
@Injectable()
export class CancelEventUseCase {
  private readonly log = createLogger(CancelEventUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
    private readonly bus: EventBus,
  ) {}

  async execute(input: { eventId: string; scope: TenantScope }): Promise<Event> {
    this.log.debug({ eventId: input.eventId }, 'events.event.cancel.started');
    const event = await this.events.findById(input.eventId);
    if (!event) {
      this.log.warn({ eventId: input.eventId }, 'events.event.not_found');
      throw new EventNotFoundError();
    }
    assertTenant(input.scope, await this.tenant.companyIdForLocal(event.localId));
    event.cancel();
    const saved = await this.events.update(event);
    await this.bus.publish(new EventCancelledEvent({ eventId: saved.id, localId: saved.localId }));
    this.log.info({ eventId: saved.id }, 'events.event.cancelled');
    return saved;
  }
}
