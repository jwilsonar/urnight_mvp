import { Inject, Injectable } from '@nestjs/common';
import type { LocalImage } from '../../domain/entities/local-image.entity';
import {
  LocalImageNotFoundError,
  LocalNotFoundError,
  TenantForbiddenError,
} from '../../domain/errors/companies.errors';
import {
  LOCAL_IMAGE_REPOSITORY,
  type LocalImageRepository,
} from '../../domain/ports/local-image.repository';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

export interface SetMainLocalImageInput {
  localId: string;
  imageId: string;
  isSuperAdmin: boolean;
  actorCompanyId?: string | null;
}

/** Marca una imagen como portada del local (excluyente) y sincroniza main_image_key. */
@Injectable()
export class SetMainLocalImageUseCase {
  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    @Inject(LOCAL_IMAGE_REPOSITORY) private readonly images: LocalImageRepository,
  ) {}

  async execute(input: SetMainLocalImageInput): Promise<LocalImage> {
    const local = await this.locals.findById(input.localId);
    if (!local) throw new LocalNotFoundError();
    if (!input.isSuperAdmin && input.actorCompanyId !== local.companyId) {
      throw new TenantForbiddenError();
    }
    const image = await this.images.findById(input.imageId);
    if (!image || image.localId !== input.localId) throw new LocalImageNotFoundError();

    await this.images.setMain(input.localId, input.imageId);
    await this.locals.setMainImageKey(input.localId, image.storageKey);
    return { ...image, isMain: true };
  }
}
