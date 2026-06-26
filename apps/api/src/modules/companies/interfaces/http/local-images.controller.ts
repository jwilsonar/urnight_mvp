import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  confirmLocalImageSchema,
  reorderLocalImagesSchema,
  type ConfirmLocalImageDto,
  type LocalImageResponse,
  type ReorderLocalImagesDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { ConfirmLocalImageUseCase } from '../../application/use-cases/confirm-local-image.use-case';
import { DeleteLocalImageUseCase } from '../../application/use-cases/delete-local-image.use-case';
import { ListLocalImagesUseCase } from '../../application/use-cases/list-local-images.use-case';
import { ReorderLocalImagesUseCase } from '../../application/use-cases/reorder-local-images.use-case';
import { SetMainLocalImageUseCase } from '../../application/use-cases/set-main-local-image.use-case';
import type { LocalImage } from '../../domain/entities/local-image.entity';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';

/**
 * Galería de imágenes de un local. /api/v1/locals/:id/images.
 * Lectura pública (catálogo); escritura admin_local del tenant dueño.
 */
@Controller('locals')
export class LocalImagesController {
  constructor(
    private readonly listImages: ListLocalImagesUseCase,
    private readonly confirmImage: ConfirmLocalImageUseCase,
    private readonly reorderImages: ReorderLocalImagesUseCase,
    private readonly setMainImage: SetMainLocalImageUseCase,
    private readonly deleteImage: DeleteLocalImageUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  /** Mapper ligado al storage del entorno (resuelve la key a URL pública). */
  private readonly toResponse = (img: LocalImage): LocalImageResponse =>
    toLocalImageResponse(img, this.storage);

  @Public()
  @Get(':id/images')
  async list(@Param('id', ParseUUIDPipe) id: string): Promise<LocalImageResponse[]> {
    return (await this.listImages.execute(id)).map(this.toResponse);
  }

  @Roles('admin_local')
  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  async confirm(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(confirmLocalImageSchema)) dto: ConfirmLocalImageDto,
  ): Promise<LocalImageResponse> {
    const image = await this.confirmImage.execute({
      localId: id,
      key: dto.key,
      isMain: dto.isMain,
      width: dto.width,
      height: dto.height,
      isSuperAdmin: actor.roles.includes('super_admin'),
      actorCompanyId: actor.companyId ?? null,
    });
    return this.toResponse(image);
  }

  // Declarado antes de :imageId para que "reorder" no se capture como UUID.
  @Roles('admin_local')
  @Patch(':id/images/reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reorderLocalImagesSchema)) dto: ReorderLocalImagesDto,
  ): Promise<LocalImageResponse[]> {
    const images = await this.reorderImages.execute({
      localId: id,
      orderedIds: dto.orderedIds,
      isSuperAdmin: actor.roles.includes('super_admin'),
      actorCompanyId: actor.companyId ?? null,
    });
    return images.map(this.toResponse);
  }

  @Roles('admin_local')
  @Patch(':id/images/:imageId/main')
  @HttpCode(HttpStatus.OK)
  async setMain(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<LocalImageResponse> {
    const image = await this.setMainImage.execute({
      localId: id,
      imageId,
      isSuperAdmin: actor.roles.includes('super_admin'),
      actorCompanyId: actor.companyId ?? null,
    });
    return this.toResponse(image);
  }

  @Roles('admin_local')
  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<void> {
    await this.deleteImage.execute({
      localId: id,
      imageId,
      isSuperAdmin: actor.roles.includes('super_admin'),
      actorCompanyId: actor.companyId ?? null,
    });
  }
}

export function toLocalImageResponse(
  img: LocalImage,
  storage: Pick<StoragePort, 'resolveUrl'>,
): LocalImageResponse {
  return {
    id: img.id,
    localId: img.localId,
    // Se persiste la key; la URL pública se resuelve según el entorno actual.
    url: storage.resolveUrl(img.storageKey),
    isMain: img.isMain,
    sortOrder: img.sortOrder,
    width: img.width,
    height: img.height,
    sizeBytes: img.sizeBytes,
    createdAt: img.createdAt.toISOString(),
  };
}
