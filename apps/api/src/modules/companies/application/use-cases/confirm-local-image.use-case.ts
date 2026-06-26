import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@urnight/contracts';
import { ObjectNotFoundError, STORAGE_PORT, type StoragePort } from '../../../../shared/adapters/storage/storage.port';
import type { LocalImage } from '../../domain/entities/local-image.entity';
import {
  InvalidUploadError,
  LocalNotFoundError,
  TenantForbiddenError,
  UploadNotFoundError,
} from '../../domain/errors/companies.errors';
import {
  LOCAL_IMAGE_REPOSITORY,
  type LocalImageRepository,
} from '../../domain/ports/local-image.repository';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

export interface ConfirmLocalImageInput {
  localId: string;
  key: string;
  isMain: boolean;
  width?: number;
  height?: number;
  isSuperAdmin: boolean;
  actorCompanyId?: string | null;
}

/**
 * Confirma una imagen ya subida a staging (tmp/). Verifica propiedad
 * (multi-tenant), valida el objeto real vía HEAD (size/mime, no confía en el
 * cliente), lo mueve a locals/{id}/ y persiste la fila local_image.
 */
@Injectable()
export class ConfirmLocalImageUseCase {
  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    @Inject(LOCAL_IMAGE_REPOSITORY) private readonly images: LocalImageRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async execute(input: ConfirmLocalImageInput): Promise<LocalImage> {
    const local = await this.locals.findById(input.localId);
    if (!local) throw new LocalNotFoundError();
    if (!input.isSuperAdmin && input.actorCompanyId !== local.companyId) {
      throw new TenantForbiddenError();
    }
    if (!input.key.startsWith('tmp/')) {
      throw new InvalidUploadError('La key de subida no es de staging.');
    }

    // Verificación server-side: el objeto existe y respeta límites reales.
    let meta;
    try {
      meta = await this.storage.headObject(input.key);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) throw new UploadNotFoundError();
      throw err;
    }
    if (meta.sizeBytes > MAX_IMAGE_BYTES) {
      await this.storage.deleteObject(input.key);
      throw new InvalidUploadError('La imagen supera el tamaño máximo permitido.');
    }
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(meta.contentType ?? '')) {
      await this.storage.deleteObject(input.key);
      throw new InvalidUploadError('Tipo de imagen no permitido.');
    }

    // tmp/{uuid}.{ext} → locals/{localId}/{uuid}.{ext}
    const filename = input.key.slice('tmp/'.length);
    const finalKey = `locals/${input.localId}/${filename}`;
    await this.storage.copyObject(input.key, finalKey);
    await this.storage.deleteObject(input.key);

    // Persistimos la KEY (no la URL): independiente del entorno/CDN. La URL
    // pública se resuelve en lectura (StoragePort.resolveUrl) en el controller.
    const sortOrder = await this.images.nextSortOrder(input.localId);
    const created = await this.images.create({
      id: randomUUID(),
      localId: input.localId,
      storageKey: finalKey,
      isMain: input.isMain,
      sortOrder,
      width: input.width ?? null,
      height: input.height ?? null,
      sizeBytes: meta.sizeBytes,
    });

    if (input.isMain) {
      await this.images.setMain(input.localId, created.id);
      await this.locals.setMainImageKey(input.localId, finalKey);
    }
    return created;
  }
}
