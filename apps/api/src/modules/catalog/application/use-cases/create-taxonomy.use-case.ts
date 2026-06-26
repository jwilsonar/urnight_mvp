import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { Zone } from '../../domain/entities/zone.entity';
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
  type CreateZoneInput,
  type TaxonomyKind,
} from '../../domain/ports/catalog.repository';

/** Caso de uso: crear un ítem de taxonomía (local_type/music_genre/tag). */
@Injectable()
export class CreateTaxonomyUseCase {
  private readonly log = createLogger(CreateTaxonomyUseCase.name);

  constructor(@Inject(CATALOG_REPOSITORY) private readonly repo: CatalogRepository) {}

  async execute(kind: TaxonomyKind, input: CreateZoneInput): Promise<Zone> {
    const saved = await this.repo.createTaxonomy(kind, input);
    this.log.info({ id: saved.id, kind }, 'catalog.taxonomy.created');
    return saved;
  }
}
