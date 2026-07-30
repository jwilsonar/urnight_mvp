import { Inject, Injectable } from "@nestjs/common";
import type { Event } from "../../domain/entities/event.entity";
import {
  EVENT_REPOSITORY,
  type EventListFilter,
  type EventRepository,
} from "../../domain/ports/event.repository";

/** Caso de uso (lectura pública): listar eventos publicados con filtros (#3). */
@Injectable()
export class ListEventsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
  ) {}

  execute(filter?: EventListFilter): Promise<Event[]> {
    return this.events.listPublished({
      ...filter,
      availableAt: filter?.availableAt ?? new Date(),
    });
  }

  async executePage(
    filter?: EventListFilter,
  ): Promise<{ events: Event[]; total: number }> {
    const sharedFilter = {
      ...filter,
      availableAt: filter?.availableAt ?? new Date(),
    };
    const [events, total] = await Promise.all([
      this.events.listPublished(sharedFilter),
      this.events.countPublished(sharedFilter),
    ]);
    return { events, total };
  }
}
