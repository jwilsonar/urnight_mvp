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

export interface ReorderLocalImagesInput {
  localId: string;
  orderedIds: string[];
  isSuperAdmin: boolean;
  actorCompanyId?: string | null;
}

/** Reordena la galería: sort_order = posición en orderedIds. */
@Injectable()
export class ReorderLocalImagesUseCase {
  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    @Inject(LOCAL_IMAGE_REPOSITORY) private readonly images: LocalImageRepository,
  ) {}

  async execute(input: ReorderLocalImagesInput): Promise<LocalImage[]> {
    const local = await this.locals.findById(input.localId);
    if (!local) throw new LocalNotFoundError();
    if (!input.isSuperAdmin && input.actorCompanyId !== local.companyId) {
      throw new TenantForbiddenError();
    }

    const current = await this.images.listByLocal(input.localId);
    const currentIds = new Set(current.map((i) => i.id));
    // Todos los ids deben pertenecer al local y cubrir la galería completa.
    const sameSize = input.orderedIds.length === current.length;
    const allBelong = input.orderedIds.every((id) => currentIds.has(id));
    if (!sameSize || !allBelong) throw new LocalImageNotFoundError();

    await this.images.reorder(input.localId, input.orderedIds);
    return this.images.listByLocal(input.localId);
  }
}
