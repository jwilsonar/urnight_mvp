import type { Local } from '../entities/local.entity';

/** Filtros de listado público de locales (#3). */
export interface LocalListFilter {
  zoneId?: string;
  localTypeId?: string;
  genreId?: string;
  tagId?: string;
  q?: string;
}

export interface LocalRepository {
  findById(id: string): Promise<Local | null>;
  findBySlug(slug: string): Promise<Local | null>;
  existsBySlug(slug: string): Promise<boolean>;
  /** Locales públicos visibles (status=active) con filtros de búsqueda (#3). */
  listVisible(filter?: LocalListFilter): Promise<Local[]>;
  /** Lectura admin: locales de una empresa (TODOS los estados). null = todas (super_admin). */
  listOwned(companyId: string | null): Promise<Local[]>;
  create(local: Local, tx?: unknown): Promise<Local>;
  update(local: Local): Promise<Local>;
  /** Actualiza la portada denormalizada (local.main_image_key: key o URL ref). */
  setMainImageKey(localId: string, key: string | null): Promise<void>;
}

export const LOCAL_REPOSITORY = Symbol('LOCAL_REPOSITORY');
