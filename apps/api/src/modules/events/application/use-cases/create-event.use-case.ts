import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateEventDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { Event } from '../../domain/entities/event.entity';
import { EventSlugTakenError } from '../../domain/errors/events.errors';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

/** Caso de uso: crear evento (admin_local del local dueño). */
@Injectable()
export class CreateEventUseCase {
  private readonly log = createLogger(CreateEventUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
  ) {}

  async execute(input: { dto: CreateEventDto; createdBy: string; scope: TenantScope }): Promise<Event> {
    this.log.debug({ localId: input.dto.localId }, 'events.event.started');
    // Aislamiento tenant: el local destino debe ser de la empresa del actor.
    assertTenant(input.scope, await this.tenant.companyIdForLocal(input.dto.localId));
    if (await this.events.existsBySlug(input.dto.slug)) throw new EventSlugTakenError();
    const event = Event.create({
      id: randomUUID(),
      localId: input.dto.localId,
      name: input.dto.name,
      slug: input.dto.slug,
      description: input.dto.description ?? null,
      startsAt: new Date(input.dto.startsAt),
      endsAt: input.dto.endsAt ? new Date(input.dto.endsAt) : null,
      flyerUrl: input.dto.flyerUrl ?? null,
      totalCapacity: input.dto.totalCapacity,
      minAgeNote: input.dto.minAgeNote,
      dressCode: input.dto.dressCode ?? null,
      createdBy: input.createdBy,
    });
    const saved = await this.events.create(event);
    this.log.info({ eventId: saved.id, localId: saved.localId }, 'events.event.created');
    return saved;
  }
}
