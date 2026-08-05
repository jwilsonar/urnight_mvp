import type { Event } from "../../../../modules/events/domain/entities/event.entity";
import type {
  EventListFilter,
  EventListItem,
  EventRepository,
} from "../../../../modules/events/domain/ports/event.repository";
import {
  calculateTrendingScore,
  compareTrendingCandidates,
  type TrendingConfig,
} from "../../../../modules/events/domain/services/trending-score";
import { InMemoryRepository } from "../in-memory.repository";

/** EventRepository en memoria. Replica las búsquedas del adapter Drizzle. */
export class InMemoryEventRepository
  extends InMemoryRepository<Event>
  implements EventRepository
{
  private readonly genresByEvent = new Map<string, string[]>();
  private readonly tagsByEvent = new Map<string, string[]>();
  private readonly ticketPricesByEvent = new Map<string, number[]>();
  private readonly recentSalesByEvent = new Map<string, number>();

  setTicketPrices(eventId: string, prices: number[]): void {
    this.ticketPricesByEvent.set(eventId, [...prices]);
  }

  setRecentSales(eventId: string, quantity: number): void {
    this.recentSalesByEvent.set(eventId, quantity);
  }

  async findById(id: string): Promise<Event | null> {
    const entity = this.getById(id);
    if (entity) {
      entity.setTaxonomy(
        this.genresByEvent.get(id) ?? [],
        this.tagsByEvent.get(id) ?? [],
      );
    }
    return entity;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    return this.values().find((e) => e.slug === slug) ?? null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.values().some((e) => e.slug === slug);
  }

  async listPublished(filter?: EventListFilter): Promise<EventListItem[]> {
    const q = filter?.q?.toLowerCase();
    const now = filter?.availableAt ?? new Date();
    const genreIds = [...new Set(filter?.genreIds ?? [])];
    const tagIds = [...new Set(filter?.tagIds ?? [])];
    const requestedCount = genreIds.length + tagIds.length;
    const results = this.values().flatMap((e) => {
      if (e.status !== "published") return [];
      if (e.startsAt < now) return [];
      if (e.totalCapacity > 0 && e.ticketsSold >= e.totalCapacity) return [];
      if (filter?.localId !== undefined && e.localId !== filter.localId)
        return [];
      if (filter?.from && e.startsAt < filter.from) return [];
      if (filter?.to && e.startsAt > filter.to) return [];
      if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
        const prices = this.ticketPricesByEvent.get(e.id) ?? [];
        const matches = prices.some(
          (price) =>
            (filter.minPrice === undefined || price >= filter.minPrice) &&
            (filter.maxPrice === undefined || price <= filter.maxPrice),
        );
        if (!matches) return [];
      }
      if (q && !`${e.name} ${e.description ?? ""}`.toLowerCase().includes(q))
        return [];
      const eventGenres = new Set(this.genresByEvent.get(e.id) ?? []);
      const eventTags = new Set(this.tagsByEvent.get(e.id) ?? []);
      const matchScore =
        genreIds.filter((id) => eventGenres.has(id)).length +
        tagIds.filter((id) => eventTags.has(id)).length;
      if (requestedCount > 0 && matchScore === 0) return [];
      return [
        {
          event: e,
          matchScore,
          matchesAll: matchScore === requestedCount,
        },
      ];
    });
    results.sort((a, b) => {
      if (a.matchesAll !== b.matchesAll) return a.matchesAll ? -1 : 1;
      if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
      const byDate = a.event.startsAt.getTime() - b.event.startsAt.getTime();
      return byDate !== 0 ? byDate : a.event.id.localeCompare(b.event.id);
    });
    const offset = filter?.offset ?? 0;
    const end = filter?.limit !== undefined ? offset + filter.limit : undefined;
    return results.slice(offset, end);
  }

  async create(event: Event): Promise<Event> {
    this.put(event);
    return event;
  }

  async countPublished(filter?: EventListFilter): Promise<number> {
    return (
      await this.listPublished({
        ...filter,
        limit: undefined,
        offset: undefined,
      })
    ).length;
  }

  async listTrending(
    limit: number,
    config: TrendingConfig,
    availableAt: Date = new Date(),
  ): Promise<Event[]> {
    const candidates = this.values().filter(
      (e) =>
        e.status === "published" &&
        e.startsAt >= availableAt &&
        (e.totalCapacity === 0 || e.ticketsSold < e.totalCapacity),
    );
    const maxRecentSales = candidates.reduce(
      (max, event) => Math.max(max, this.recentSalesByEvent.get(event.id) ?? 0),
      0,
    );
    return candidates
      .map((event) => ({
        event,
        id: event.id,
        startsAt: event.startsAt,
        score: calculateTrendingScore(
          {
            recentSales: this.recentSalesByEvent.get(event.id) ?? 0,
            maxRecentSales,
            startsAt: event.startsAt,
            ticketsSold: event.ticketsSold,
            capacity: event.totalCapacity,
          },
          config,
          availableAt,
        ),
      }))
      .sort(compareTrendingCandidates)
      .slice(0, limit)
      .map(({ event }) => event);
  }

  async listUpcoming(limit: number): Promise<Event[]> {
    const now = new Date();
    return this.values()
      .filter(
        (e) =>
          e.status === "published" &&
          e.startsAt >= now &&
          (e.totalCapacity === 0 || e.ticketsSold < e.totalCapacity),
      )
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
