import { Inject, Injectable } from '@nestjs/common';
import type { FavoriteTargetType } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { FavoriteNotFoundError } from '../../domain/errors/identity.errors';
import {
  USER_FAVORITE_REPOSITORY,
  type UserFavoriteRepository,
} from '../../domain/ports/user-favorite.repository';

/** Caso de uso: quitar un favorito del usuario. */
@Injectable()
export class RemoveFavoriteUseCase {
  private readonly log = createLogger(RemoveFavoriteUseCase.name);

  constructor(
    @Inject(USER_FAVORITE_REPOSITORY)
    private readonly favorites: UserFavoriteRepository,
  ) {}

  async execute(input: {
    userId: string;
    targetType: FavoriteTargetType;
    targetId: string;
  }): Promise<void> {
    const removed = await this.favorites.remove(input.userId, input.targetType, input.targetId);
    if (!removed) throw new FavoriteNotFoundError();
    this.log.info(
      { userId: input.userId, targetType: input.targetType, targetId: input.targetId },
      'identity.favorite.removed',
    );
  }
}
