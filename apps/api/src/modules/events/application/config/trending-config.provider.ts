import { Inject, Injectable } from "@nestjs/common";
import type { PlatformSetting } from "../../../ops/domain/entities/platform-setting.entity";
import {
  PLATFORM_SETTING_REPOSITORY,
  type PlatformSettingRepository,
} from "../../../ops/domain/ports/ops.ports";
import type { TrendingConfigPort } from "../../domain/ports/trending-config.port";
import {
  DEFAULT_TRENDING_CONFIG,
  type TrendingConfig,
} from "../../domain/services/trending-score";

const CONFIG_CACHE_TTL_MS = 60_000;

export const TRENDING_SETTING_KEYS = Object.freeze({
  weightVelocity: "trending.weight_velocity",
  weightProximity: "trending.weight_proximity",
  weightIntensity: "trending.weight_intensity",
  velocityWindowDays: "trending.velocity_window_days",
});

const ALL_SETTING_KEYS = Object.values(TRENDING_SETTING_KEYS);

@Injectable()
export class TrendingConfigProvider implements TrendingConfigPort {
  private cached: { config: TrendingConfig; expiresAt: number } | null = null;
  private inFlight: Promise<TrendingConfig> | null = null;

  constructor(
    @Inject(PLATFORM_SETTING_REPOSITORY)
    private readonly settings: PlatformSettingRepository,
  ) {}

  async current(): Promise<TrendingConfig> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) return this.cached.config;
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.loadAndCache(now);
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  private async loadAndCache(now: number): Promise<TrendingConfig> {
    let config: TrendingConfig;
    try {
      const rows = await this.settings.findByKeys(ALL_SETTING_KEYS);
      config = this.parse(rows);
    } catch {
      // La configuracion afina el ranking, pero no es una dependencia critica
      // del home: ante una falla temporal se sirve una politica conocida.
      config = { ...DEFAULT_TRENDING_CONFIG };
    }
    this.cached = { config, expiresAt: now + CONFIG_CACHE_TTL_MS };
    return config;
  }

  private parse(rows: readonly PlatformSetting[]): TrendingConfig {
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const config: TrendingConfig = {
      weightVelocity: this.numberInRange(
        byKey.get(TRENDING_SETTING_KEYS.weightVelocity),
        0,
        1,
        DEFAULT_TRENDING_CONFIG.weightVelocity,
      ),
      weightProximity: this.numberInRange(
        byKey.get(TRENDING_SETTING_KEYS.weightProximity),
        0,
        1,
        DEFAULT_TRENDING_CONFIG.weightProximity,
      ),
      weightIntensity: this.numberInRange(
        byKey.get(TRENDING_SETTING_KEYS.weightIntensity),
        0,
        1,
        DEFAULT_TRENDING_CONFIG.weightIntensity,
      ),
      velocityWindowDays: this.integerInRange(
        byKey.get(TRENDING_SETTING_KEYS.velocityWindowDays),
        1,
        90,
        DEFAULT_TRENDING_CONFIG.velocityWindowDays,
      ),
    };

    if (
      config.weightVelocity +
        config.weightProximity +
        config.weightIntensity ===
      0
    ) {
      config.weightVelocity = DEFAULT_TRENDING_CONFIG.weightVelocity;
      config.weightProximity = DEFAULT_TRENDING_CONFIG.weightProximity;
      config.weightIntensity = DEFAULT_TRENDING_CONFIG.weightIntensity;
    }
    return config;
  }

  private numberInRange(
    setting: PlatformSetting | undefined,
    min: number,
    max: number,
    fallback: number,
  ): number {
    if (!setting || setting.valueType !== "number") return fallback;
    const raw = setting.value.trim();
    const value = Number(raw);
    return raw !== "" && Number.isFinite(value) && value >= min && value <= max
      ? value
      : fallback;
  }

  private integerInRange(
    setting: PlatformSetting | undefined,
    min: number,
    max: number,
    fallback: number,
  ): number {
    const value = this.numberInRange(setting, min, max, fallback);
    return Number.isInteger(value) ? value : fallback;
  }
}
