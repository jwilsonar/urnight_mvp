import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';
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

export interface DeleteLocalImageInput {
  localId: string;
  imageId: string;
  isSuperAdmin: boolean;
  actorCompanyId?: string | null;
}

/** Elimina una imagen de local: objeto en S3 + fila. Limpia portada si aplica. */
@Injectable()
export class DeleteLocalImageUseCase {
  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    @Inject(LOCAL_IMAGE_REPOSITORY) private readonly images: LocalImageRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async execute(input: DeleteLocalImageInput): Promise<void> {
    const local = await this.locals.findById(input.localId);
    if (!local) throw new LocalNotFoundError();
    if (!input.isSuperAdmin && input.actorCompanyId !== local.companyId) {
      throw new TenantForbiddenError();
    }
    const image = await this.images.findById(input.imageId);
    if (!image || image.localId !== input.localId) throw new LocalImageNotFoundError();

    await this.storage.deleteObject(this.storage.toKey(image.storageKey));
    await this.images.delete(input.imageId);
    if (image.isMain) await this.locals.setMainImageKey(input.localId, null);
  }
}
