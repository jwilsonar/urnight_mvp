import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  gt,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  activeEventHoldQuantitySql,
  availableCapacity,
  availableCapacitySql,
  event,
  eventGenre,
  eventTag,
  local,
  musicGenre,
  tag,
  ticketType,
} from "@urnight/db";
import {
  DRIZZLE,
  type DrizzleDb,
} from "../../../../shared/database/drizzle.constants";
import { Event, type EventStatus } from "../../domain/entities/event.entity";
import type {
  EventCatalogOrder,
  EventListFilter,
  EventRepository,
} from "../../domain/ports/event.repository";
import {
  normalizeSearch,
  normalizedColumn,
} from "../../../../shared/database/search-normalize";

type Row = typeof event.$inferSelect;
type RowWithAvailability = Row & { availableCapacity?: number };

@Injectable()
export class DrizzleEventRepository implements EventRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<Event | null> {
    const [row] = await this.db
      .select(this.eventSelection())
      .from(event)
      .where(eq(event.id, id))
      .limit(1);
    if (!row) return null;
    return this.withTaxonomy(this.toDomain(row));
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const [row] = await this.db
      .select(this.eventSelection())
      .from(event)
      .where(eq(event.slug, slug))
      .limit(1);
    if (!row) return null;
    return this.withTaxonomy(this.toDomain(row));
  }

  /** Carga categorías/géneros y etiquetas asociadas y las adjunta a la entidad. */
  private async withTaxonomy(entity: Event): Promise<Event> {
    const [genres, tags] = await Promise.all([
      this.db
        .select({ id: eventGenre.genreId })
        .from(eventGenre)
        .where(eq(eventGenre.eventId, entity.id)),
      this.db
        .select({ id: eventTag.tagId })
        .from(eventTag)
        .where(eq(eventTag.eventId, entity.id)),
    ]);
    entity.setTaxonomy(
      genres.map((g) => g.id),
      tags.map((t) => t.id),
    );
    return entity;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: event.id })
      .from(event)
      .where(eq(event.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  private publishedConditions(filter?: EventListFilter): SQL[] {
    const at = filter?.availableAt ?? new Date();
    const activeHolds = activeEventHoldQuantitySql(event.id, at);
    const conditions: SQL[] = [
      eq(event.status, "published"),
      // startsAt es timestamptz: comparar instantes evita crear otra convención
      // de zona horaria distinta a la que ya usan los presets de Lima.
      gte(event.startsAt, at),
      or(
        eq(event.totalCapacity, 0),
        gt(
          availableCapacitySql(
            event.totalCapacity,
            event.ticketsSold,
            activeHolds,
          ),
          0,
        ),
      ) as SQL,
    ];
    if (filter?.localId) conditions.push(eq(event.localId, filter.localId));
    if (filter?.zoneId) {
      conditions.push(
        inArray(
          event.localId,
          this.db
            .select({ id: local.id })
            .from(local)
            .where(eq(local.zoneId, filter.zoneId)),
        ),
      );
    }
    if (filter?.genreId) {
      conditions.push(
        inArray(
          event.id,
          this.db
            .select({ id: eventGenre.eventId })
            .from(eventGenre)
            .where(eq(eventGenre.genreId, filter.genreId)),
        ),
      );
    }
    if (filter?.tagId) {
      conditions.push(
        inArray(
          event.id,
          this.db
            .select({ id: eventTag.eventId })
            .from(eventTag)
            .where(eq(eventTag.tagId, filter.tagId)),
        ),
      );
    }
    if (filter?.q) {
      const normalized = normalizeSearch(filter.q);
      if (normalized) {
        const pattern = `%${normalized}%`;
        const tagMatch = this.db
          .select({ id: eventTag.eventId })
          .from(eventTag)
          .innerJoin(tag, eq(eventTag.tagId, tag.id))
          .where(sql`${normalizedColumn(tag.name)} like ${pattern}`);
        const genreMatch = this.db
          .select({ id: eventGenre.eventId })
          .from(eventGenre)
          .innerJoin(musicGenre, eq(eventGenre.genreId, musicGenre.id))
          .where(sql`${normalizedColumn(musicGenre.name)} like ${pattern}`);
        const customTagMatch = sql`exists (select 1 from jsonb_array_elements_text(${event.customTags}) as ct(v) where ${normalizedColumn(sql`ct.v`)} like ${pattern})`;
        conditions.push(
          or(
            sql`${normalizedColumn(event.name)} like ${pattern}`,
            sql`${normalizedColumn(event.description)} like ${pattern}`,
            customTagMatch,
            inArray(event.id, tagMatch),
            inArray(event.id, genreMatch),
          ) as SQL,
        );
      }
    }
    if (filter?.from) conditions.push(gte(event.startsAt, filter.from));
    if (filter?.to) conditions.push(lte(event.startsAt, filter.to));
    if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
      const priceConditions: SQL[] = [];
      if (filter.minPrice !== undefined) {
        priceConditions.push(gte(ticketType.price, filter.minPrice.toFixed(2)));
      }
      if (filter.maxPrice !== undefined) {
        priceConditions.push(lte(ticketType.price, filter.maxPrice.toFixed(2)));
      }
      conditions.push(
        inArray(
          event.id,
          this.db
            .select({ id: ticketType.eventId })
            .from(ticketType)
            .where(and(...priceConditions)),
        ),
      );
    }
    return conditions;
  }

  private publishedOrder(order: EventCatalogOrder = "soonest"): SQL[] {
    const strategies: Record<EventCatalogOrder, SQL[]> = {
      soonest: [asc(event.startsAt), asc(event.id)],
    };
    return strategies[order];
  }

  async listPublished(filter?: EventListFilter): Promise<Event[]> {
    let query = this.db
      .select(this.eventSelection(filter?.availableAt))
      .from(event)
      .where(and(...this.publishedConditions(filter)))
      .orderBy(...this.publishedOrder(filter?.order))
      .$dynamic();
    if (filter?.limit !== undefined) query = query.limit(filter.limit);
    if (filter?.offset !== undefined) query = query.offset(filter.offset);
    const rows = await query;
    return rows.map((r) => this.toDomain(r));
  }

  async countPublished(filter?: EventListFilter): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(event)
      .where(and(...this.publishedConditions(filter)));
    return Number(row?.total ?? 0);
  }

  async listTrending(limit: number): Promise<Event[]> {
    const filter = { availableAt: new Date() };
    const rows = await this.db
      .select(this.eventSelection(filter.availableAt))
      .from(event)
      .where(and(...this.publishedConditions(filter)))
      .orderBy(desc(event.ticketsSold), desc(event.checkinsCount))
      .limit(limit);
    return rows.map((r) => this.toDomain(r));
  }

  async listUpcoming(limit: number): Promise<Event[]> {
    const filter = { availableAt: new Date() };
    const rows = await this.db
      .select(this.eventSelection(filter.availableAt))
      .from(event)
      .where(and(...this.publishedConditions(filter)))
      .orderBy(...this.publishedOrder())
      .limit(limit);
    return rows.map((r) => this.toDomain(r));
  }

  async listByLocal(localId: string): Promise<Event[]> {
    const rows = await this.db
      .select(this.eventSelection())
      .from(event)
      .where(eq(event.localId, localId))
      .orderBy(desc(event.startsAt));
    return rows.map((r) => this.toDomain(r));
  }

  async create(entity: Event): Promise<Event> {
    const [row] = await this.db
      .insert(event)
      .values({
        id: entity.id,
        localId: entity.localId,
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        startsAt: entity.startsAt,
        endsAt: entity.endsAt,
        flyerUrl: entity.flyerUrl,
        totalCapacity: entity.totalCapacity,
        status: entity.status,
        minAgeNote: entity.minAgeNote,
        dressCode: entity.dressCode,
        customTags: entity.customTags,
        createdBy: entity.createdBy,
      })
      .returning();
    if (!row) throw new Error("No se pudo crear el evento");
    return this.toDomain(row);
  }

  async update(entity: Event): Promise<Event> {
    const [row] = await this.db
      .update(event)
      .set({
        name: entity.name,
        description: entity.description,
        startsAt: entity.startsAt,
        endsAt: entity.endsAt,
        flyerUrl: entity.flyerUrl,
        totalCapacity: entity.totalCapacity,
        minAgeNote: entity.minAgeNote,
        dressCode: entity.dressCode,
        customTags: entity.customTags,
        status: entity.status,
        publishedAt: entity.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(event.id, entity.id))
      .returning();
    if (!row) throw new Error("No se pudo actualizar el evento");
    return this.toDomain(row);
  }

  async setGenres(eventId: string, genreIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(eventGenre).where(eq(eventGenre.eventId, eventId));
      const unique = [...new Set(genreIds)];
      if (unique.length > 0) {
        await tx
          .insert(eventGenre)
          .values(unique.map((genreId) => ({ eventId, genreId })));
      }
    });
  }

  async setTags(eventId: string, tagIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(eventTag).where(eq(eventTag.eventId, eventId));
      const unique = [...new Set(tagIds)];
      if (unique.length > 0) {
        await tx
          .insert(eventTag)
          .values(unique.map((tagId) => ({ eventId, tagId })));
      }
    });
  }

  private eventSelection(at: Date = new Date()) {
    const activeHolds = activeEventHoldQuantitySql(event.id, at);
    return {
      ...getTableColumns(event),
      availableCapacity: availableCapacitySql(
        event.totalCapacity,
        event.ticketsSold,
        activeHolds,
      ),
    };
  }

  private toDomain(row: RowWithAvailability): Event {
    return Event.fromPersistence({
      id: row.id,
      localId: row.localId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      flyerUrl: row.flyerUrl,
      totalCapacity: row.totalCapacity,
      ticketsSold: row.ticketsSold,
      availableCapacity:
        row.totalCapacity === 0
          ? null
          : row.availableCapacity === undefined
            ? availableCapacity(row.totalCapacity, row.ticketsSold, 0)
            : Number(row.availableCapacity),
      checkinsCount: row.checkinsCount,
      status: row.status as EventStatus,
      minAgeNote: row.minAgeNote,
      dressCode: row.dressCode,
      customTags: row.customTags ?? [],
      createdBy: row.createdBy,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
