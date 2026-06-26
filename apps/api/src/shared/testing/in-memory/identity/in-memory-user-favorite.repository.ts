import type { FavoriteTargetType } from '@urnight/contracts';
import type { Favorite } from '../../../../modules/identity/domain/entities/favorite.entity';
import type {
  EnrichedFavorite,
  UserFavoriteRepository,
} from '../../../../modules/identity/domain/ports/user-favorite.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** UserFavoriteRepository en memoria (tier unitario). */
export class InMemoryUserFavoriteRepository
  extends InMemoryRepository<Favorite>
  implements UserFavoriteRepository
{
  async add(favorite: Favorite): Promise<Favorite> {
    this.put(favorite);
    return favorite;
  }

  async remove(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<boolean> {
    const match = this.values().find(
      (f) => f.userId === userId && f.targetType === targetType && f.targetId === targetId,
    );
    if (!match) return false;
    this.items.delete(match.id);
    return true;
  }

  async listByUser(userId: string): Promise<Favorite[]> {
    return this.values()
      .filter((f) => f.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Tier unitario sin catálogo: proyecta sin datos de target (name/slug vacíos). */
  async listEnrichedByUser(userId: string): Promise<EnrichedFavorite[]> {
    return (await this.listByUser(userId)).map((f) => ({
      id: f.id,
      targetType: f.targetType,
      targetId: f.targetId,
      createdAt: f.createdAt,
      name: '',
      slug: '',
      imageRef: null,
      startsAt: null,
      status: null,
    }));
  }

  /** Tier unitario sin catálogo de eventos: nada que limpiar. */
  async removeStaleEventFavorites(): Promise<number> {
    return 0;
  }

  async exists(
    userId: string,
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<boolean> {
    return this.values().some(
      (f) => f.userId === userId && f.targetType === targetType && f.targetId === targetId,
    );
  }
}
