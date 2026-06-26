import type { FavoriteTargetType } from '@urnight/contracts';
import type { Favorite } from '../entities/favorite.entity';

/**
 * Favorito enriquecido con datos del target (read-model cross-módulo). `imageRef`
 * es la key/URL del storage SIN resolver — el HTTP layer la pasa por
 * StoragePort.resolveUrl. `startsAt`/`status` solo aplican a eventos.
 */
export interface EnrichedFavorite {
  id: string;
  targetType: FavoriteTargetType;
  targetId: string;
  createdAt: Date;
  name: string;
  slug: string;
  imageRef: string | null;
  startsAt: Date | null;
  status: string | null;
}

/** Puerto del repositorio de favoritos del usuario (lista, no aggregate). */
export interface UserFavoriteRepository {
  add(favorite: Favorite): Promise<Favorite>;
  /** Devuelve true si eliminó una fila; false si no existía. */
  remove(userId: string, targetType: FavoriteTargetType, targetId: string): Promise<boolean>;
  listByUser(userId: string): Promise<Favorite[]>;
  /** Favoritos con datos del target (nombre/slug/portada) para la vista Guardados. */
  listEnrichedByUser(userId: string): Promise<EnrichedFavorite[]>;
  /**
   * Borra los favoritos de eventos cancelados o ya pasados (finished o startsAt
   * en el pasado). Devuelve el nº de filas eliminadas. Limpieza perezosa en cada
   * lectura de Guardados.
   */
  removeStaleEventFavorites(userId: string): Promise<number>;
  exists(userId: string, targetType: FavoriteTargetType, targetId: string): Promise<boolean>;
}

export const USER_FAVORITE_REPOSITORY = Symbol('USER_FAVORITE_REPOSITORY');
