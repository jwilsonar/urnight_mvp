import type { Zone } from '../entities/zone.entity';

/** Datos para crear una zona (ya validados en el edge). */
export interface CreateZoneInput {
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Puerto del repositorio de catálogo (Port). El dominio habla con esta interfaz;
 * el adapter Drizzle vive en infrastructure (§3.2 Repository).
 */
/** Taxonomías hermanas de zone (misma forma: name/slug/displayOrder/isActive). */
export type TaxonomyKind = 'local_type' | 'music_genre' | 'tag';

export interface CatalogRepository {
  listZones(): Promise<Zone[]>;
  createZone(input: CreateZoneInput): Promise<Zone>;
  /** Lista/crea para las taxonomías local_type, music_genre, tag (reutiliza el item Zone). */
  listTaxonomy(kind: TaxonomyKind): Promise<Zone[]>;
  createTaxonomy(kind: TaxonomyKind, input: CreateZoneInput): Promise<Zone>;
}

/** Token DI del puerto. */
export const CATALOG_REPOSITORY = Symbol('CATALOG_REPOSITORY');
