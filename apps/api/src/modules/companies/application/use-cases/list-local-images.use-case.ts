import { Inject, Injectable } from '@nestjs/common';
import type { LocalImage } from '../../domain/entities/local-image.entity';
import {
  LOCAL_IMAGE_REPOSITORY,
  type LocalImageRepository,
} from '../../domain/ports/local-image.repository';

/** Galería pública de un local (ordenada por sort_order). */
@Injectable()
export class ListLocalImagesUseCase {
  constructor(
    @Inject(LOCAL_IMAGE_REPOSITORY) private readonly images: LocalImageRepository,
  ) {}

  execute(localId: string): Promise<LocalImage[]> {
    return this.images.listByLocal(localId);
  }
}
