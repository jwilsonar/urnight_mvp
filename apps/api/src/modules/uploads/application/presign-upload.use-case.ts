import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IMAGE_EXTENSION_BY_TYPE,
  type AcceptedImageType,
  type PresignRequestDto,
  type PresignResponseDto,
} from '@urnight/contracts';
import { createLogger } from '../../../shared/logging/logger';
import { STORAGE_PORT, type StoragePort } from '../../../shared/adapters/storage/storage.port';

/** Segundos de validez de la URL firmada de subida (corto: el confirm sigue enseguida). */
const UPLOAD_URL_TTL = 300; // 5 min

/**
 * Caso de uso: firmar una URL de subida directa a S3 sobre una key de staging
 * `tmp/{uuid}.{ext}`. No liga el objeto a ningún tenant: la autorización
 * multi-tenant la hace el confirm del módulo dueño. mime y tamaño máximo ya
 * vienen validados por el schema Zod compartido.
 */
@Injectable()
export class PresignUploadUseCase {
  private readonly log = createLogger(PresignUploadUseCase.name);

  constructor(@Inject(STORAGE_PORT) private readonly storage: StoragePort) {}

  async execute(input: PresignRequestDto): Promise<PresignResponseDto> {
    const ext = IMAGE_EXTENSION_BY_TYPE[input.contentType as AcceptedImageType];
    const key = `tmp/${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.getUploadUrl(key, input.contentType, UPLOAD_URL_TTL);
    this.log.info({ key, contentType: input.contentType }, 'uploads.presign.created');
    return { uploadUrl, key, expiresIn: UPLOAD_URL_TTL };
  }
}
