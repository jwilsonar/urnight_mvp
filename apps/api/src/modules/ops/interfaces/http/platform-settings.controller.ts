import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import {
  SESSION_IDLE_TIMEOUT_SETTING_KEY,
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
import { SettingNotFoundError } from '../../domain/errors/ops.errors';

/**
 * Claves que pueden leerse sin autenticación (config de cliente).
 * El resto de ajustes (comisiones, TTL de lock, ventana de atribución, etc.) son
 * internos y solo se sirven a super_admin — evita fuga de política de negocio (B4/§6).
 */
const PUBLIC_SETTING_KEYS: ReadonlySet<string> = new Set([
  'currency',
  'min_age',
  'maintenance_mode',
  'support_email',
  'terms_current_version',
  'feature_flags',
  SESSION_IDLE_TIMEOUT_SETTING_KEY,
]);

/** Ajustes de plataforma. /api/v1/platform-settings. Lectura pública SOLO de claves en allowlist; escritura super_admin. */
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly getSetting: GetPlatformSettingUseCase,
    private readonly upsertSetting: UpsertPlatformSettingUseCase,
  ) {}

  @Public()
  @Get(':key')
  async get(@Param('key') key: string): Promise<PlatformSettingResponse> {
    // Clave no pública ⇒ 404 (no revela existencia de ajustes internos a anónimos).
    if (!PUBLIC_SETTING_KEYS.has(key)) throw new SettingNotFoundError();
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
