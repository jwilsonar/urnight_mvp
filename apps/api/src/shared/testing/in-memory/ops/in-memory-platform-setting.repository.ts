import type { PlatformSetting } from "../../../../modules/ops/domain/entities/platform-setting.entity";
import type { PlatformSettingRepository } from "../../../../modules/ops/domain/ports/ops.ports";

/**
 * PlatformSettingRepository en memoria. Replica el adapter Drizzle: el `upsert`
 * usa `onConflictDoUpdate(target: key)`, así que la clave de unicidad es `key`
 * (no `id`). Por eso este repo NO extiende `InMemoryRepository` (cuya base se
 * indexa por `id`, getter que la entidad no expone) y almacena por `key`.
 * NUNCA se mockea el ORM (estrategia de testing UrNight).
 */
export class InMemoryPlatformSettingRepository implements PlatformSettingRepository {
  private readonly byKey = new Map<string, PlatformSetting>();

  /** Precarga un ajuste sin pasar por `upsert` (datos de referencia). */
  seed(setting: PlatformSetting): this {
    this.byKey.set(setting.key, setting);
    return this;
  }

  async findByKey(key: string): Promise<PlatformSetting | null> {
    return this.byKey.get(key) ?? null;
  }

  async findByKeys(keys: readonly string[]): Promise<PlatformSetting[]> {
    return keys.flatMap((key) => {
      const setting = this.byKey.get(key);
      return setting ? [setting] : [];
    });
  }

  async upsert(setting: PlatformSetting): Promise<PlatformSetting> {
    this.byKey.set(setting.key, setting);
    return setting;
  }

  /** Estado actual (solo lectura) — útil para aserciones en los tests. */
  get all(): readonly PlatformSetting[] {
    return [...this.byKey.values()];
  }

  get size(): number {
    return this.byKey.size;
  }
}
