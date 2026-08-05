import type { PlatformSetting } from "../../../ops/domain/entities/platform-setting.entity";
import { InMemoryPlatformSettingRepository } from "../../../../shared/testing/in-memory/ops";
import { PlatformSettingBuilder } from "../../../../shared/testing/builders/ops";
import { describe, expect, it } from "vitest";
import { DEFAULT_TRENDING_CONFIG } from "../../domain/services/trending-score";
import {
  TRENDING_SETTING_KEYS,
  TrendingConfigProvider,
} from "./trending-config.provider";

function numberSetting(key: string, value: string): PlatformSetting {
  return new PlatformSettingBuilder()
    .withKey(key)
    .withTypedValue(value, "number")
    .build();
}

describe("TrendingConfigProvider", () => {
  it("usa los valores por defecto cuando los ajustes no existen", async () => {
    const provider = new TrendingConfigProvider(
      new InMemoryPlatformSettingRepository(),
    );

    await expect(provider.current()).resolves.toEqual(DEFAULT_TRENDING_CONFIG);
  });

  it("usa cada ajuste valido de platform_setting", async () => {
    const settings = new InMemoryPlatformSettingRepository()
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightVelocity, "0.7"))
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightProximity, "0.1"))
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightIntensity, "0.1"))
      .seed(numberSetting(TRENDING_SETTING_KEYS.velocityWindowDays, "30"));

    await expect(
      new TrendingConfigProvider(settings).current(),
    ).resolves.toEqual({
      weightVelocity: 0.7,
      weightProximity: 0.1,
      weightIntensity: 0.1,
      velocityWindowDays: 30,
    });
  });

  it("reemplaza ajustes invalidos por defaults sin lanzar excepcion", async () => {
    const settings = new InMemoryPlatformSettingRepository()
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightVelocity, ""))
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightProximity, "2"))
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightIntensity, "-0.1"))
      .seed(numberSetting(TRENDING_SETTING_KEYS.velocityWindowDays, "7.5"));

    await expect(
      new TrendingConfigProvider(settings).current(),
    ).resolves.toEqual(DEFAULT_TRENDING_CONFIG);
  });

  it("restaura todos los pesos por defecto si la suma configurada es cero", async () => {
    const settings = new InMemoryPlatformSettingRepository()
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightVelocity, "0"))
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightProximity, "0"))
      .seed(numberSetting(TRENDING_SETTING_KEYS.weightIntensity, "0"));

    await expect(
      new TrendingConfigProvider(settings).current(),
    ).resolves.toEqual(DEFAULT_TRENDING_CONFIG);
  });

  it("usa defaults si el almacen de ajustes no responde", async () => {
    class UnavailableSettingsRepository extends InMemoryPlatformSettingRepository {
      override async findByKeys(
        _keys: readonly string[],
      ): Promise<PlatformSetting[]> {
        throw new Error("settings unavailable");
      }
    }

    await expect(
      new TrendingConfigProvider(new UnavailableSettingsRepository()).current(),
    ).resolves.toEqual(DEFAULT_TRENDING_CONFIG);
  });

  it("cachea la configuracion para no consultar el almacen en cada request", async () => {
    class CountingSettingsRepository extends InMemoryPlatformSettingRepository {
      reads = 0;

      override async findByKeys(
        keys: readonly string[],
      ): Promise<PlatformSetting[]> {
        this.reads += 1;
        return super.findByKeys(keys);
      }
    }
    const settings = new CountingSettingsRepository().seed(
      numberSetting(TRENDING_SETTING_KEYS.weightVelocity, "0.8"),
    );
    const provider = new TrendingConfigProvider(settings);

    const first = await provider.current();
    await settings.upsert(
      numberSetting(TRENDING_SETTING_KEYS.weightVelocity, "0.1"),
    );
    const second = await provider.current();

    expect(first.weightVelocity).toBe(0.8);
    expect(second.weightVelocity).toBe(0.8);
    expect(settings.reads).toBe(1);
  });
});
