import { Inject, Injectable } from '@nestjs/common';
import {
  USER_FAVORITE_REPOSITORY,
  type EnrichedFavorite,
  type UserFavoriteRepository,
} from '../../domain/ports/user-favorite.repository';

/**
 * Caso de uso: listar los favoritos del usuario enriquecidos con datos del
 * target (nombre/slug/portada) para la vista Guardados. Antes de leer, limpia
 * perezosamente los favoritos de eventos cancelados o ya pasados (§4.3).
 */
@Injectable()
export class ListEnrichedFavoritesUseCase {
  constructor(
    @Inject(USER_FAVORITE_REPOSITORY)
    private readonly favorites: UserFavoriteRepository,
  ) {}

  async execute(input: { userId: string }): Promise<EnrichedFavorite[]> {
    await this.favorites.removeStaleEventFavorites(input.userId);
    return this.favorites.listEnrichedByUser(input.userId);
  }
}
