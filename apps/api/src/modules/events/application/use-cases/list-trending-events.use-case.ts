import { Inject, Injectable } from '@nestjs/common';
import type { Event } from '../../domain/entities/event.entity';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

/** Caso de uso (lectura pública): eventos en tendencia (#9). */
@Injectable()
export class ListTrendingEventsUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly events: EventRepository) {}

  execute(input?: { limit?: number }): Promise<Event[]> {
    return this.events.listTrending(input?.limit ?? 12);
  }
}
