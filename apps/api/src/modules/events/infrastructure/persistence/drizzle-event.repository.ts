import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { event, eventGenre, eventTag, local, musicGenre, tag } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { Event, type EventStatus } from '../../domain/entities/event.entity';
import type { EventListFilter, EventRepository } from '../../domain/ports/event.repository';
import { normalizeSearch, normalizedColumn } from '../../../../shared/database/search-normalize';

type Row = typeof event.$inferSelect;

@Injectable()
export class DrizzleEventRepository implements EventRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<Event | null> {
    const [row] = await this.db.select().from(event).where(eq(event.id, id)).limit(1);
    if (!row) return null;
    return this.withTaxonomy(this.toDomain(row));
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const [row] = await this.db.select().from(event).where(eq(event.slug, slug)).limit(1);
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
      this.db.select({ id: eventTag.tagId }).from(eventTag).where(eq(eventTag.eventId, entity.id)),
    ]);
    entity.setTaxonomy(
      genres.map((g) => g.id),
      tags.map((t) => t.id),
    );
    return entity;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const [row] = await this.db.select({ id: event.id }).from(event).where(eq(event.slug, slug)).limit(1);
    return Boolean(row);
  }

  async listPublished(filter?: EventListFilter): Promise<Event[]> {
    const conditions: SQL[] = [eq(event.status, 'published')];
    if (filter?.localId) conditions.push(eq(event.localId, filter.localId));
    if (filter?.zoneId) {
      conditions.push(
        inArray(
          event.localId,
          this.db.select({ id: local.id }).from(local).where(eq(local.zoneId, filter.zoneId)),
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
      // Búsqueda inteligente (#3): normaliza acentos/espacios/mayúsculas y matchea
      // contra nombre, descripción Y los nombres de categorías/géneros y etiquetas
      // asociados. Así "DJ Peligro" se encuentra con "djpeligro", "dj" o "DJ".
      const nq = normalizeSearch(filter.q);
      if (nq) {
        const pattern = `%${nq}%`;
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
        // Etiquetas libres (JSON): matchea cada elemento del array normalizado.
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

    const rows = await this.db
      .select()
      .from(event)
      .where(and(...conditions))
      .orderBy(desc(event.startsAt));
    return rows.map((r) => this.toDomain(r));
  }

  async listTrending(limit: number): Promise<Event[]> {
    const rows = await this.db
      .select()
      .from(event)
      .where(eq(event.status, 'published'))
      .orderBy(desc(event.ticketsSold), desc(event.checkinsCount))
      .limit(limit);
    return rows.map((r) => this.toDomain(r));
  }

  async listUpcoming(limit: number): Promise<Event[]> {
    const rows = await this.db
      .select()
      .from(event)
      .where(and(eq(event.status, 'published'), gte(event.startsAt, new Date())))
      .orderBy(asc(event.startsAt))
      .limit(limit);
    return rows.map((r) => this.toDomain(r));
  }

  async listByLocal(localId: string): Promise<Event[]> {
    const rows = await this.db
      .select()
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
    if (!row) throw new Error('No se pudo crear el evento');
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
    if (!row) throw new Error('No se pudo actualizar el evento');
    return this.toDomain(row);
  }

  async setGenres(eventId: string, genreIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(eventGenre).where(eq(eventGenre.eventId, eventId));
      const unique = [...new Set(genreIds)];
      if (unique.length > 0) {
        await tx.insert(eventGenre).values(unique.map((genreId) => ({ eventId, genreId })));
      }
    });
  }

  async setTags(eventId: string, tagIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(eventTag).where(eq(eventTag.eventId, eventId));
      const unique = [...new Set(tagIds)];
      if (unique.length > 0) {
        await tx.insert(eventTag).values(unique.map((tagId) => ({ eventId, tagId })));
      }
    });
  }

  private toDomain(row: Row): Event {
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
