import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { localType, musicGenre, tag, zone } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { Zone } from '../../domain/entities/zone.entity';
import type {
  CatalogRepository,
  CreateZoneInput,
  TaxonomyKind,
} from '../../domain/ports/catalog.repository';

type ZoneRow = typeof zone.$inferSelect;

/** Tablas hermanas keyed por TaxonomyKind (misma columna shape que zone). */
const TAXONOMY_TABLES = { local_type: localType, music_genre: musicGenre, tag } as const;

/** Adapter Drizzle del puerto CatalogRepository (driven). */
@Injectable()
export class DrizzleCatalogRepository implements CatalogRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async listZones(): Promise<Zone[]> {
    const rows = await this.db.select().from(zone).orderBy(asc(zone.displayOrder));
    return rows.map((row) => this.toDomain(row));
  }

  async createZone(input: CreateZoneInput): Promise<Zone> {
    const [row] = await this.db
      .insert(zone)
      .values({
        name: input.name,
        slug: input.slug,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear la zona');
    return this.toDomain(row);
  }

  async listTaxonomy(kind: TaxonomyKind): Promise<Zone[]> {
    const table = TAXONOMY_TABLES[kind];
    const rows = await this.db.select().from(table).orderBy(asc(table.displayOrder));
    return rows.map((row) => this.toDomain(row));
  }

  async createTaxonomy(kind: TaxonomyKind, input: CreateZoneInput): Promise<Zone> {
    const table = TAXONOMY_TABLES[kind];
    const [row] = await this.db
      .insert(table)
      .values({
        name: input.name,
        slug: input.slug,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      })
      .returning();
    if (!row) throw new Error('No se pudo crear el ítem de taxonomía');
    return this.toDomain(row);
  }

  /** Mapea fila (snake_case en DB) → aggregate de dominio. */
  private toDomain(row: ZoneRow): Zone {
    return Zone.fromPersistence({
      id: row.id,
      name: row.name,
      slug: row.slug,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
