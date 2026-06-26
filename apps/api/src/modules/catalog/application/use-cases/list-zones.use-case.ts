import { Inject, Injectable } from '@nestjs/common';
import type { Zone } from '../../domain/entities/zone.entity';
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
} from '../../domain/ports/catalog.repository';

/** Caso de uso: listar zonas (lectura, CQRS ligero §3.2). */
@Injectable()
export class ListZonesUseCase {
  constructor(@Inject(CATALOG_REPOSITORY) private readonly repo: CatalogRepository) {}

  execute(): Promise<Zone[]> {
    return this.repo.listZones();
  }
}
