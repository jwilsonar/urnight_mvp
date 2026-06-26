import { Inject, Injectable } from '@nestjs/common';
import type { Favorite } from '../../domain/entities/favorite.entity';
import {
  USER_FAVORITE_REPOSITORY,
  type UserFavoriteRepository,
} from '../../domain/ports/user-favorite.repository';

/** Caso de uso: listar los favoritos del usuario autenticado. */
@Injectable()
export class ListFavoritesUseCase {
  constructor(
    @Inject(USER_FAVORITE_REPOSITORY)
    private readonly favorites: UserFavoriteRepository,
  ) {}

  execute(input: { userId: string }): Promise<Favorite[]> {
    return this.favorites.listByUser(input.userId);
  }
}
