import { Inject, Injectable } from '@nestjs/common';
import type { Event } from '../../domain/entities/event.entity';
import { EVENT_REPOSITORY, type EventRepository } from '../../domain/ports/event.repository';

/**
 * Caso de uso (lectura pública): próximos eventos (#10 recomendados / #18
 * calendario). Heurística mínima: publicados con startsAt >= ahora, por fecha.
 */
@Injectable()
export class ListUpcomingEventsUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly events: EventRepository) {}

  execute(input?: { limit?: number }): Promise<Event[]> {
    return this.events.listUpcoming(input?.limit ?? 50);
  }
}
