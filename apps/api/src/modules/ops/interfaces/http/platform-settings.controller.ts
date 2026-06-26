import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import {
  upsertPlatformSettingSchema,
  type PlatformSettingResponse,
  type UpsertPlatformSettingDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { GetPlatformSettingUseCase } from '../../application/use-cases/get-platform-setting.use-case';
import { UpsertPlatformSettingUseCase } from '../../application/use-cases/upsert-platform-setting.use-case';
import type { PlatformSetting } from '../../domain/entities/platform-setting.entity';

/** Ajustes de plataforma. /api/v1/platform-settings. Lectura pública; escritura super_admin. */
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly getSetting: GetPlatformSettingUseCase,
    private readonly upsertSetting: UpsertPlatformSettingUseCase,
  ) {}

  @Public()
  @Get(':key')
  async get(@Param('key') key: string): Promise<PlatformSettingResponse> {
    return toResponse(await this.getSetting.execute(key));
  }

  @Roles('super_admin')
  @Put()
  @HttpCode(HttpStatus.OK)
  async upsert(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(upsertPlatformSettingSchema)) dto: UpsertPlatformSettingDto,
  ): Promise<PlatformSettingResponse> {
    return toResponse(await this.upsertSetting.execute({ dto, updatedBy: actor.id }));
  }
}

function toResponse(s: PlatformSetting): PlatformSettingResponse {
  return {
    key: s.key,
    value: s.value,
    valueType: s.valueType,
    updatedAt: s.updatedAt.toISOString(),
  };
}
