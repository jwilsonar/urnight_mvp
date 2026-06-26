import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { Zone } from '../../domain/entities/zone.entity';
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
  type CreateZoneInput,
} from '../../domain/ports/catalog.repository';

/** Caso de uso: crear zona (una operación de negocio orquestada §3.2). */
@Injectable()
export class CreateZoneUseCase {
  private readonly log = createLogger(CreateZoneUseCase.name);

  constructor(@Inject(CATALOG_REPOSITORY) private readonly repo: CatalogRepository) {}

  async execute(input: CreateZoneInput): Promise<Zone> {
    const saved = await this.repo.createZone(input);
    this.log.info({ zoneId: saved.id }, 'catalog.zone.created');
    return saved;
  }
}
