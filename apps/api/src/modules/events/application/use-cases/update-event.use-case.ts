import { Inject, Injectable } from '@nestjs/common';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, type UpdateEventDto } from '@urnight/contracts';
import {
  ObjectNotFoundError,
  STORAGE_PORT,
  type StoragePort,
} from '../../../../shared/adapters/storage/storage.port';
import { createLogger } from '../../../../shared/logging/logger';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { Event } from '../../domain/entities/event.entity';
import {
  EventFlyerInvalidError,
  EventFlyerNotFoundError,
  EventNotFoundError,
} from '../../domain/errors/events.errors';
import { EVENT_TENANT_PORT, type EventTenantPort } from '../../domain/ports/event-tenant.port';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

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
      const finalKey = await this.promoteFlyer(input.eventId, dto.flyerKey, event.flyerUrl);
      event.setFlyer(finalKey);
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

  /**
   * Promueve una imagen de staging (tmp/) al prefijo final del evento tras
   * verificarla server-side (no confía en el cliente). Devuelve la key final.
   */
  private async promoteFlyer(
    eventId: string,
    stagingKey: string,
    currentFlyer: string | null,
  ): Promise<string> {
    if (!stagingKey.startsWith('tmp/')) {
      throw new EventFlyerInvalidError('La key de subida no es de staging.');
    }

    let meta;
    try {
      meta = await this.storage.headObject(stagingKey);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) throw new EventFlyerNotFoundError();
      throw err;
    }
    if (meta.sizeBytes > MAX_IMAGE_BYTES) {
      await this.storage.deleteObject(stagingKey);
      throw new EventFlyerInvalidError('La imagen supera el tamaño máximo permitido.');
    }
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(meta.contentType ?? '')) {
      await this.storage.deleteObject(stagingKey);
      throw new EventFlyerInvalidError('Tipo de imagen no permitido.');
    }

    // tmp/{uuid}.{ext} → events/{eventId}/{uuid}.{ext}
    const filename = stagingKey.slice('tmp/'.length);
    const finalKey = `events/${eventId}/${filename}`;
    await this.storage.copyObject(stagingKey, finalKey);
    await this.storage.deleteObject(stagingKey);

    // Best-effort: borrar el flyer anterior solo si era una key nuestra del
    // evento (no una URL externa/seed). No bloquea la operación si falla.
    if (currentFlyer && currentFlyer.startsWith(`events/${eventId}/`)) {
      try {
        await this.storage.deleteObject(currentFlyer);
      } catch (err) {
        this.log.warn({ eventId, key: currentFlyer, err }, 'events.event.flyer.delete-old-failed');
      }
    }
    return finalKey;
  }
}
