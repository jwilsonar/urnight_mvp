import { Module } from '@nestjs/common';
import { CreateTaxonomyUseCase } from './application/use-cases/create-taxonomy.use-case';
import { CreateZoneUseCase } from './application/use-cases/create-zone.use-case';
import { ListTaxonomyUseCase } from './application/use-cases/list-taxonomy.use-case';
import { ListZonesUseCase } from './application/use-cases/list-zones.use-case';
import { CATALOG_REPOSITORY } from './domain/ports/catalog.repository';
import { DrizzleCatalogRepository } from './infrastructure/persistence/drizzle-catalog.repository';
import { CatalogController } from './interfaces/http/catalog.controller';
import {
  LocalTypesController,
  MusicGenresController,
  TagsController,
} from './interfaces/http/taxonomy.controllers';

/**
 * Módulo Catalog (bounded context Taxonomy & Catalogs). Hexágono de referencia:
 * liga el puerto CATALOG_REPOSITORY al adapter Drizzle (DI).
 */
@Module({
  controllers: [CatalogController, LocalTypesController, MusicGenresController, TagsController],
  providers: [
    ListZonesUseCase,
    CreateZoneUseCase,
    ListTaxonomyUseCase,
    CreateTaxonomyUseCase,
    { provide: CATALOG_REPOSITORY, useClass: DrizzleCatalogRepository },
  ],
})
export class CatalogModule {}
