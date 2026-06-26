import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { createZoneSchema, type CreateZoneDto, type ZoneResponse } from '@urnight/contracts';
import { Public } from '../../../../edge/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreateTaxonomyUseCase } from '../../application/use-cases/create-taxonomy.use-case';
import { ListTaxonomyUseCase } from '../../application/use-cases/list-taxonomy.use-case';
import type { Zone } from '../../domain/entities/zone.entity';

function toResponse(item: Zone): ZoneResponse {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/** /api/v1/local-types — tipos de local (discoteca, bar, rooftop, karaoke). */
@Public()
@Controller('local-types')
export class LocalTypesController {
  constructor(
    private readonly list: ListTaxonomyUseCase,
    private readonly create: CreateTaxonomyUseCase,
  ) {}

  @Get()
  async findAll(): Promise<ZoneResponse[]> {
    return (await this.list.execute('local_type')).map(toResponse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @Body(new ZodValidationPipe(createZoneSchema)) dto: CreateZoneDto,
  ): Promise<ZoneResponse> {
    return toResponse(await this.create.execute('local_type', dto));
  }
}

/** /api/v1/music-genres — géneros musicales. */
@Public()
@Controller('music-genres')
export class MusicGenresController {
  constructor(
    private readonly list: ListTaxonomyUseCase,
    private readonly create: CreateTaxonomyUseCase,
  ) {}

  @Get()
  async findAll(): Promise<ZoneResponse[]> {
    return (await this.list.execute('music_genre')).map(toResponse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @Body(new ZodValidationPipe(createZoneSchema)) dto: CreateZoneDto,
  ): Promise<ZoneResponse> {
    return toResponse(await this.create.execute('music_genre', dto));
  }
}

/** /api/v1/tags — etiquetas (terraza, DJ invitado, dress code…). */
@Public()
@Controller('tags')
export class TagsController {
  constructor(
    private readonly list: ListTaxonomyUseCase,
    private readonly create: CreateTaxonomyUseCase,
  ) {}

  @Get()
  async findAll(): Promise<ZoneResponse[]> {
    return (await this.list.execute('tag')).map(toResponse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @Body(new ZodValidationPipe(createZoneSchema)) dto: CreateZoneDto,
  ): Promise<ZoneResponse> {
    return toResponse(await this.create.execute('tag', dto));
  }
}
