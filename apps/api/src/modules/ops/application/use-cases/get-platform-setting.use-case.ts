import { Inject, Injectable } from '@nestjs/common';
import type { PlatformSetting } from '../../domain/entities/platform-setting.entity';
import { SettingNotFoundError } from '../../domain/errors/ops.errors';
import {
  PLATFORM_SETTING_REPOSITORY,
  type PlatformSettingRepository,
} from '../../domain/ports/ops.ports';

/** Caso de uso: leer un ajuste de plataforma por key. */
@Injectable()
export class GetPlatformSettingUseCase {
  constructor(
    @Inject(PLATFORM_SETTING_REPOSITORY) private readonly settings: PlatformSettingRepository,
  ) {}

  async execute(key: string): Promise<PlatformSetting> {
    const setting = await this.settings.findByKey(key);
    if (!setting) throw new SettingNotFoundError();
    return setting;
  }
}
