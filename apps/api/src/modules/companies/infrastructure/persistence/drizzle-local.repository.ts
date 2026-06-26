import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { local, localGenre, localLocalType, localTag, musicGenre, tag } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { normalizeSearch, normalizedColumn } from '../../../../shared/database/search-normalize';
import type { Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { Local, type LocalStatus } from '../../domain/entities/local.entity';
import type { LocalListFilter, LocalRepository } from '../../domain/ports/local.repository';

type Row = typeof local.$inferSelect;

@Injectable()
export class DrizzleLocalRepository implements LocalRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private exec(tx?: unknown): DrizzleDb | Tx {
    return (tx as Tx | undefined) ?? this.db;
  }

  async findById(id: string): Promise<Local | null> {
    const [row] = await this.db.select().from(local).where(eq(local.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Local | null> {
    const [row] = await this.db.select().from(local).where(eq(local.slug, slug)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const [row] = await this.db.select({ id: local.id }).from(local).where(eq(local.slug, slug)).limit(1);
    return Boolean(row);
  }

  async listVisible(filter?: LocalListFilter): Promise<Local[]> {
    const conditions: SQL[] = [eq(local.status, 'active')];
    if (filter?.zoneId) conditions.push(eq(local.zoneId, filter.zoneId));
    if (filter?.localTypeId) {
      conditions.push(
        inArray(
          local.id,
          this.db
            .select({ id: localLocalType.localId })
            .from(localLocalType)
            .where(eq(localLocalType.localTypeId, filter.localTypeId)),
        ),
      );
    }
    if (filter?.genreId) {
      conditions.push(
        inArray(
          local.id,
          this.db
            .select({ id: localGenre.localId })
            .from(localGenre)
            .where(eq(localGenre.genreId, filter.genreId)),
        ),
      );
    }
    if (filter?.tagId) {
      conditions.push(
        inArray(
          local.id,
          this.db.select({ id: localTag.localId }).from(localTag).where(eq(localTag.tagId, filter.tagId)),
        ),
      );
    }
    if (filter?.q) {
      // Búsqueda inteligente (#3): normaliza acentos/espacios/mayúsculas y matchea
      // contra nombre, descripción Y los nombres de géneros/etiquetas asociados.
      const nq = normalizeSearch(filter.q);
      if (nq) {
        const pattern = `%${nq}%`;
        const tagMatch = this.db
          .select({ id: localTag.localId })
          .from(localTag)
          .innerJoin(tag, eq(localTag.tagId, tag.id))
          .where(sql`${normalizedColumn(tag.name)} like ${pattern}`);
        const genreMatch = this.db
          .select({ id: localGenre.localId })
          .from(localGenre)
          .innerJoin(musicGenre, eq(localGenre.genreId, musicGenre.id))
          .where(sql`${normalizedColumn(musicGenre.name)} like ${pattern}`);
        conditions.push(
          or(
            sql`${normalizedColumn(local.name)} like ${pattern}`,
            sql`${normalizedColumn(local.description)} like ${pattern}`,
            inArray(local.id, tagMatch),
            inArray(local.id, genreMatch),
          ) as SQL,
        );
      }
    }
    const rows = await this.db.select().from(local).where(and(...conditions));
    return rows.map((r) => this.toDomain(r));
  }

  async listOwned(companyId: string | null): Promise<Local[]> {
    const rows = companyId
      ? await this.db
          .select()
          .from(local)
          .where(eq(local.companyId, companyId))
          .orderBy(desc(local.createdAt))
      : await this.db.select().from(local).orderBy(desc(local.createdAt));
    return rows.map((r) => this.toDomain(r));
  }

  async create(entity: Local, tx?: unknown): Promise<Local> {
    const [row] = await this.exec(tx)
      .insert(local)
      .values({
        id: entity.id,
        companyId: entity.companyId,
        zoneId: entity.zoneId,
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        address: entity.address,
        latitude: entity.latitude,
        longitude: entity.longitude,
        mainImageKey: entity.mainImageKey,
        status: entity.status,
        isVerified: entity.isVerified,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el local');
    return this.toDomain(row);
  }

  async update(entity: Local): Promise<Local> {
    const [row] = await this.db
      .update(local)
      .set({
        status: entity.status,
        isVerified: entity.isVerified,
        updatedAt: new Date(),
      })
      .where(eq(local.id, entity.id))
      .returning();
    if (!row) throw new Error('No se pudo actualizar el local');
    return this.toDomain(row);
  }

  async setMainImageKey(localId: string, key: string | null): Promise<void> {
    await this.db
      .update(local)
      .set({ mainImageKey: key, updatedAt: new Date() })
      .where(eq(local.id, localId));
  }

  private toDomain(row: Row): Local {
    return Local.fromPersistence({
      id: row.id,
      companyId: row.companyId,
      zoneId: row.zoneId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      googleMapsUrl: row.googleMapsUrl,
      socials: row.socials,
      mainImageKey: row.mainImageKey,
      status: row.status as LocalStatus,
      suspensionReason: row.suspensionReason,
      isVerified: row.isVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
