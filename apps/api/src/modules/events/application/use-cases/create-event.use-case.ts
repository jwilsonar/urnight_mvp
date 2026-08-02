import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateEventDto } from '@urnight/contracts';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';
import { createLogger } from '../../../../shared/logging/logger';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { Event } from '../../domain/entities/event.entity';
import { EventSlugTakenError } from '../../domain/errors/events.errors';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';
import { promoteStagedFlyer, validateStagedFlyer } from '../services/flyer-storage';

/** Caso de uso: crear evento (admin_local del local dueño). */
@Injectable()
export class CreateEventUseCase {
  private readonly log = createLogger(CreateEventUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async execute(input: { dto: CreateEventDto; createdBy: string; scope: TenantScope }): Promise<Event> {
    this.log.debug({ localId: input.dto.localId }, 'events.event.started');
    // Aislamiento tenant: el local destino debe ser de la empresa del actor.
    assertTenant(input.scope, await this.tenant.companyIdForLocal(input.dto.localId));
    if (await this.events.existsBySlug(input.dto.slug)) throw new EventSlugTakenError();
    // Flyer en staging: se valida ANTES de insertar para fallar temprano sin
    // dejar un evento a medias; la promoción necesita el id, va tras el create.
    if (input.dto.flyerKey) await validateStagedFlyer(this.storage, input.dto.flyerKey);
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
    let saved = await this.events.create(event);
    if (input.dto.flyerKey) {
      saved.setFlyer(await promoteStagedFlyer(this.storage, saved.id, input.dto.flyerKey));
      saved = await this.events.update(saved);
    }
    if (input.dto.genreIds !== undefined) {
      await this.events.setGenres(saved.id, input.dto.genreIds);
    }
    if (input.dto.tagIds !== undefined) {
      await this.events.setTags(saved.id, input.dto.tagIds);
    }
    this.log.info({ eventId: saved.id, localId: saved.localId }, 'events.event.created');
    return (await this.events.findById(saved.id)) ?? saved;
  }
}
