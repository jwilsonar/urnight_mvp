import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import {
  addFavoriteSchema,
  FAVORITE_TARGET_TYPES,
  type AddFavoriteDto,
  type FavoriteResponse,
  type FavoriteTargetType,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';
import { AddFavoriteUseCase } from '../../application/use-cases/add-favorite.use-case';
import { ListEnrichedFavoritesUseCase } from '../../application/use-cases/list-enriched-favorites.use-case';
import { RemoveFavoriteUseCase } from '../../application/use-cases/remove-favorite.use-case';
import type { Favorite } from '../../domain/entities/favorite.entity';
import type { EnrichedFavorite } from '../../domain/ports/user-favorite.repository';

/** Favoritos del usuario autenticado (§4.3). /api/v1/me/favorites. */
@Controller('me/favorites')
export class FavoritesController {
  constructor(
    private readonly addFavorite: AddFavoriteUseCase,
    private readonly removeFavorite: RemoveFavoriteUseCase,
    private readonly listFavorites: ListEnrichedFavoritesUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<FavoriteResponse[]> {
    const favorites = await this.listFavorites.execute({ userId: user.id });
    return favorites.map((f) => toEnrichedResponse(f, this.storage));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(addFavoriteSchema)) dto: AddFavoriteDto,
  ): Promise<FavoriteResponse> {
    return toResponse(await this.addFavorite.execute({ userId: user.id, dto }));
  }

  @Delete(':targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ): Promise<void> {
    await this.removeFavorite.execute({
      userId: user.id,
      targetType: assertTargetType(targetType),
      targetId,
    });
  }
}

function assertTargetType(value: string): FavoriteTargetType {
  if ((FAVORITE_TARGET_TYPES as readonly string[]).includes(value)) {
    return value as FavoriteTargetType;
  }
  throw new BadRequestException("targetType debe ser 'local' o 'event'");
}

function toResponse(f: Favorite): FavoriteResponse {
  return {
    id: f.id,
    targetType: f.targetType,
    targetId: f.targetId,
    createdAt: f.createdAt.toISOString(),
    // El POST no enriquece: el target lo resuelve la vista Guardados (GET).
    target: null,
  };
}

/** Mapper enriquecido: resuelve la portada (key/ref) a URL pública vía StoragePort. */
function toEnrichedResponse(
  f: EnrichedFavorite,
  storage: Pick<StoragePort, 'resolveUrl'>,
): FavoriteResponse {
  return {
    id: f.id,
    targetType: f.targetType,
    targetId: f.targetId,
    createdAt: f.createdAt.toISOString(),
    target: {
      name: f.name,
      slug: f.slug,
      imageUrl: f.imageRef ? storage.resolveUrl(f.imageRef) : null,
      startsAt: f.startsAt ? f.startsAt.toISOString() : null,
      status: f.status,
    },
  };
}
