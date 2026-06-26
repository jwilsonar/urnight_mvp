import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { UpsertPlatformSettingDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { PlatformSetting } from '../../domain/entities/platform-setting.entity';
import {
  PLATFORM_SETTING_REPOSITORY,
  type PlatformSettingRepository,
} from '../../domain/ports/ops.ports';

/** Caso de uso: crear/actualizar un ajuste de plataforma (super_admin). */
@Injectable()
export class UpsertPlatformSettingUseCase {
  private readonly log = createLogger(UpsertPlatformSettingUseCase.name);

  constructor(
    @Inject(PLATFORM_SETTING_REPOSITORY) private readonly settings: PlatformSettingRepository,
  ) {}

  async execute(input: { dto: UpsertPlatformSettingDto; updatedBy: string }): Promise<PlatformSetting> {
    const setting = PlatformSetting.create({
      id: randomUUID(),
      key: input.dto.key,
      value: input.dto.value,
      valueType: input.dto.valueType,
      updatedBy: input.updatedBy,
    });
    const upserted = await this.settings.upsert(setting);
    this.log.info({ key: upserted.key }, 'ops.platform_setting.updated');
    return upserted;
  }
}
