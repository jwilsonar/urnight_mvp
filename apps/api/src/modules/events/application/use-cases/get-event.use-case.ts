import { Inject, Injectable } from '@nestjs/common';
import type { Event } from '../../domain/entities/event.entity';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

/** Caso de uso (lectura pública): detalle de evento por slug. */
@Injectable()
export class GetEventUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly events: EventRepository) {}

  async execute(slug: string): Promise<Event> {
    const event = await this.events.findBySlug(slug);
    if (!event) throw new EventNotFoundError();
    return event;
  }
}
