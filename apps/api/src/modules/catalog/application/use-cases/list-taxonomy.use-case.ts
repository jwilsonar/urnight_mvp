import { Inject, Injectable } from '@nestjs/common';
import type { Zone } from '../../domain/entities/zone.entity';
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
  type TaxonomyKind,
} from '../../domain/ports/catalog.repository';

/** Caso de uso: listar una taxonomía (local_type/music_genre/tag). */
@Injectable()
export class ListTaxonomyUseCase {
  constructor(@Inject(CATALOG_REPOSITORY) private readonly repo: CatalogRepository) {}

  execute(kind: TaxonomyKind): Promise<Zone[]> {
    return this.repo.listTaxonomy(kind);
  }
}
