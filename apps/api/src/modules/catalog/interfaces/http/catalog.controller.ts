import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { createZoneSchema, type CreateZoneDto, type ZoneResponse } from '@urnight/contracts';
import { Public } from '../../../../edge/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import type { Zone } from '../../domain/entities/zone.entity';
import { CreateZoneUseCase } from '../../application/use-cases/create-zone.use-case';
import { ListZonesUseCase } from '../../application/use-cases/list-zones.use-case';

/** Adapter driving (REST). Recursos en kebab-case plural (§2.3): /api/v1/zones. */
@Public() // Fase 1: catálogo de lectura abierto; ABM se protegerá con RBAC (super_admin).
@Controller('zones')
export class CatalogController {
  constructor(
    private readonly listZones: ListZonesUseCase,
    private readonly createZone: CreateZoneUseCase,
  ) {}

  @Get()
  async findAll(): Promise<ZoneResponse[]> {
    const zones = await this.listZones.execute();
    return zones.map(toResponse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createZoneSchema)) dto: CreateZoneDto,
  ): Promise<ZoneResponse> {
    const zone = await this.createZone.execute(dto);
    return toResponse(zone);
  }
}

/** Mapea aggregate → DTO de salida (camelCase, fechas ISO). */
function toResponse(zone: Zone): ZoneResponse {
  return {
    id: zone.id,
    name: zone.name,
    slug: zone.slug,
    displayOrder: zone.displayOrder,
    isActive: zone.isActive,
    createdAt: zone.createdAt.toISOString(),
    updatedAt: zone.updatedAt.toISOString(),
  };
}
