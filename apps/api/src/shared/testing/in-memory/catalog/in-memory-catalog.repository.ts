import { randomUUID } from 'node:crypto';
import { Zone } from '../../../../modules/catalog/domain/entities/zone.entity';
import type {
  CatalogRepository,
  CreateZoneInput,
  TaxonomyKind,
} from '../../../../modules/catalog/domain/ports/catalog.repository';
import { InMemoryRepository } from '../in-memory.repository';

/**
 * CatalogRepository en memoria. Replica el adapter Drizzle: `create*` genera
 * id/createdAt/updatedAt (como hace la DB) y reconstituye vía `Zone.fromPersistence`;
 * los listados se devuelven ordenados por `displayOrder` (igual que `asc(displayOrder)`).
 *
 * Las zonas y las taxonomías hermanas (local_type, music_genre, tag) comparten la
 * misma forma `Zone`, así que se almacenan en buckets separados por clave.
 */
export class InMemoryCatalogRepository
  extends InMemoryRepository<Zone>
  implements CatalogRepository
{
  /** Buckets de taxonomías hermanas (cada una con su propio almacén). */
  private readonly taxonomies = new Map<TaxonomyKind, Map<string, Zone>>([
    ['local_type', new Map<string, Zone>()],
    ['music_genre', new Map<string, Zone>()],
    ['tag', new Map<string, Zone>()],
  ]);

  /** Precarga una zona sin pasar por `createZone` (datos de referencia). */
  seedZone(zone: Zone): this {
    this.put(zone);
    return this;
  }

  /** Precarga un ítem de una taxonomía hermana. */
  seedTaxonomy(kind: TaxonomyKind, zone: Zone): this {
    this.bucket(kind).set(zone.id, zone);
    return this;
  }

  async listZones(): Promise<Zone[]> {
    return this.sortByDisplayOrder(this.values());
  }

  async createZone(input: CreateZoneInput): Promise<Zone> {
    const zone = this.materialize(input);
    this.put(zone);
    return zone;
  }

  async listTaxonomy(kind: TaxonomyKind): Promise<Zone[]> {
    return this.sortByDisplayOrder([...this.bucket(kind).values()]);
  }

  async createTaxonomy(kind: TaxonomyKind, input: CreateZoneInput): Promise<Zone> {
    const zone = this.materialize(input);
    this.bucket(kind).set(zone.id, zone);
    return zone;
  }

  /** Cantidad de ítems de una taxonomía hermana (útil para aserciones). */
  taxonomySize(kind: TaxonomyKind): number {
    return this.bucket(kind).size;
  }

  private bucket(kind: TaxonomyKind): Map<string, Zone> {
    const store = this.taxonomies.get(kind);
    if (!store) throw new Error(`TaxonomyKind desconocido: ${kind}`);
    return store;
  }

  /** Construye una `Zone` desde un input asignando id/timestamps (como la DB). */
  private materialize(input: CreateZoneInput): Zone {
    const now = new Date();
    return Zone.fromPersistence({
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    });
  }

  private sortByDisplayOrder(zones: Zone[]): Zone[] {
    return [...zones].sort((a, b) => a.displayOrder - b.displayOrder);
  }
}
