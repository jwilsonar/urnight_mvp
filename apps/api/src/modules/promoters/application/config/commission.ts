import { Inject, Injectable } from "@nestjs/common";
import { DEFAULT_COMMISSION_RATE_SETTING_KEY } from "@urnight/contracts";
import type { PlatformSetting } from "../../../ops/domain/entities/platform-setting.entity";
import {
  PLATFORM_SETTING_REPOSITORY,
  type PlatformSettingRepository,
} from "../../../ops/domain/ports/ops.ports";

export function parsePromoterCommissionRate(
  setting: PlatformSetting | null,
): number {
  if (
    !setting ||
    setting.key !== DEFAULT_COMMISSION_RATE_SETTING_KEY ||
    setting.valueType !== "number"
  ) {
    throw new Error(
      `Falta ${DEFAULT_COMMISSION_RATE_SETTING_KEY} numérico en PLATFORM_SETTING`,
    );
  }
  const raw = setting.value.trim();
  const rate = Number(raw);
  if (raw === "" || !Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(
      `${DEFAULT_COMMISSION_RATE_SETTING_KEY} debe estar entre 0 y 1`,
    );
  }
  return rate;
}

/** Lee la política vigente solo al crear el snapshot de una nueva atribución. */
@Injectable()
export class PromoterCommissionPolicy {
  constructor(
    @Inject(PLATFORM_SETTING_REPOSITORY)
    private readonly settings: PlatformSettingRepository,
  ) {}

  async currentRate(): Promise<number> {
    return parsePromoterCommissionRate(
      await this.settings.findByKey(DEFAULT_COMMISSION_RATE_SETTING_KEY),
    );
  }
}
