import { Inject, Injectable } from '@nestjs/common';
import type { UpdateEventDto } from '@urnight/contracts';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';
import { createLogger } from '../../../../shared/logging/logger';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { Event } from '../../domain/entities/event.entity';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';
import { promoteStagedFlyer } from '../services/flyer-storage';

/**
 * Caso de uso: editar un evento de MI empresa (admin_local dueño). Aislado por
 * tenant. Si llega `flyerKey` (key de staging tmp/), valida el objeto real vía
 * HEAD, lo promueve a `events/{id}/` y reemplaza el flyer actual (borrando el
 * anterior si era una key nuestra). Persiste la KEY, no la URL (§3.2).
 */
@Injectable()
export class UpdateEventUseCase {
  private readonly log = createLogger(UpdateEventUseCase.name);

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_TENANT_PORT) private readonly tenant: EventTenantPort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async execute(input: { eventId: string; dto: UpdateEventDto; scope: TenantScope }): Promise<Event> {
    const event = await this.events.findById(input.eventId);
    if (!event) throw new EventNotFoundError();
    // Aislamiento tenant: el local del evento debe ser de la empresa del actor.
    assertTenant(input.scope, await this.tenant.companyIdForLocal(event.localId));

    const { dto } = input;
    event.edit({
      name: dto.name,
      description: dto.description,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt === null ? null : dto.endsAt ? new Date(dto.endsAt) : undefined,
      totalCapacity: dto.totalCapacity,
      minAgeNote: dto.minAgeNote,
      dressCode: dto.dressCode,
      customTags: dto.customTags,
    });

    if (dto.flyerKey) {
      const currentFlyer = event.flyerUrl;
      const finalKey = await promoteStagedFlyer(this.storage, input.eventId, dto.flyerKey);
      event.setFlyer(finalKey);
      // Best-effort: borrar el flyer anterior solo si era una key nuestra del
      // evento (no una URL externa/seed). No bloquea la operación si falla.
      if (currentFlyer && currentFlyer.startsWith(`events/${input.eventId}/`)) {
        try {
          await this.storage.deleteObject(currentFlyer);
        } catch (err) {
          this.log.warn({ eventId: input.eventId, key: currentFlyer, err }, 'events.event.flyer.delete-old-failed');
        }
      }
    }

    const saved = await this.events.update(event);

    // Taxonomías (categorías/géneros y etiquetas): si el DTO las trae, reemplaza
    // el set actual. Ausentes → no se tocan (PATCH parcial).
    if (dto.genreIds) await this.events.setGenres(saved.id, dto.genreIds);
    if (dto.tagIds) await this.events.setTags(saved.id, dto.tagIds);

    this.log.info(
      {
        eventId: saved.id,
        flyerReplaced: Boolean(dto.flyerKey),
        genresUpdated: Boolean(dto.genreIds),
        tagsUpdated: Boolean(dto.tagIds),
      },
      'events.event.updated',
    );

    // Re-lee con las taxonomías ya aplicadas para devolverlas en la respuesta.
    return (await this.events.findById(saved.id)) ?? saved;
  }
}
