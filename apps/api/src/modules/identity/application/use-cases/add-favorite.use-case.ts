import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { AddFavoriteDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { Favorite } from '../../domain/entities/favorite.entity';
import { FavoriteAlreadyExistsError } from '../../domain/errors/identity.errors';
import {
  USER_FAVORITE_REPOSITORY,
  type UserFavoriteRepository,
} from '../../domain/ports/user-favorite.repository';

/** Caso de uso: marcar un local/evento como favorito (idempotente vía 409). */
@Injectable()
export class AddFavoriteUseCase {
  private readonly log = createLogger(AddFavoriteUseCase.name);

  constructor(
    @Inject(USER_FAVORITE_REPOSITORY)
    private readonly favorites: UserFavoriteRepository,
  ) {}

  async execute(input: { userId: string; dto: AddFavoriteDto }): Promise<Favorite> {
    const { userId, dto } = input;
    if (await this.favorites.exists(userId, dto.targetType, dto.targetId)) {
      throw new FavoriteAlreadyExistsError();
    }
    const favorite = Favorite.create({
      id: randomUUID(),
      userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
    });
    const saved = await this.favorites.add(favorite);
    this.log.info(
      { userId, targetType: dto.targetType, targetId: dto.targetId },
      'identity.favorite.added',
    );
    return saved;
  }
}
