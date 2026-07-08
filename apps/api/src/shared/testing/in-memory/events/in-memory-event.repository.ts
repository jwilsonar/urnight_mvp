import type { Event } from '../../../../modules/events/domain/entities/event.entity';
import type {
  EventListFilter,
  EventRepository,
} from '../../../../modules/events/domain/ports/event.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** EventRepository en memoria. Replica las búsquedas del adapter Drizzle. */
export class InMemoryEventRepository
  extends InMemoryRepository<Event>
  implements EventRepository
{
  private readonly genresByEvent = new Map<string, string[]>();
  private readonly tagsByEvent = new Map<string, string[]>();

  async findById(id: string): Promise<Event | null> {
    const entity = this.getById(id);
    if (entity) {
      entity.setTaxonomy(this.genresByEvent.get(id) ?? [], this.tagsByEvent.get(id) ?? []);
    }
    return entity;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    return this.values().find((e) => e.slug === slug) ?? null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.values().some((e) => e.slug === slug);
  }

  async listPublished(filter?: EventListFilter): Promise<Event[]> {
    const q = filter?.q?.toLowerCase();
    const results = this.values().filter((e) => {
      if (e.status !== 'published') return false;
      if (filter?.localId !== undefined && e.localId !== filter.localId) return false;
      if (filter?.from && e.startsAt < filter.from) return false;
      if (filter?.to && e.startsAt > filter.to) return false;
      if (q && !`${e.name} ${e.description ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const offset = filter?.offset ?? 0;
    const end = filter?.limit !== undefined ? offset + filter.limit : undefined;
    return results.slice(offset, end);
  }

  async create(event: Event): Promise<Event> {
    this.put(event);
    return event;
  }

  async listTrending(limit: number): Promise<Event[]> {
    return this.values()
      .filter((e) => e.status === 'published')
      .sort((a, b) => b.ticketsSold - a.ticketsSold)
      .slice(0, limit);
  }

  async listUpcoming(limit: number): Promise<Event[]> {
    const now = new Date();
    return this.values()
      .filter((e) => e.status === 'published' && e.startsAt >= now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, limit);
  }

  async listByLocal(localId: string): Promise<Event[]> {
    return this.values().filter((e) => e.localId === localId);
  }

  async update(event: Event): Promise<Event> {
    this.put(event);
    return event;
  }

  async setGenres(eventId: string, genreIds: string[]): Promise<void> {
    this.genresByEvent.set(eventId, [...new Set(genreIds)]);
  }

  async setTags(eventId: string, tagIds: string[]): Promise<void> {
    this.tagsByEvent.set(eventId, [...new Set(tagIds)]);
  }
}
