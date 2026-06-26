import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { platformSetting } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import {
  PlatformSetting,
  type SettingValueType,
} from '../../domain/entities/platform-setting.entity';
import type { PlatformSettingRepository } from '../../domain/ports/ops.ports';

type Row = typeof platformSetting.$inferSelect;

@Injectable()
export class DrizzlePlatformSettingRepository implements PlatformSettingRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByKey(key: string): Promise<PlatformSetting | null> {
    const [row] = await this.db
      .select()
      .from(platformSetting)
      .where(eq(platformSetting.key, key))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async upsert(entity: PlatformSetting): Promise<PlatformSetting> {
    const [row] = await this.db
      .insert(platformSetting)
      .values({
        key: entity.key,
        value: entity.value,
        valueType: entity.valueType,
      })
      .onConflictDoUpdate({
        target: platformSetting.key,
        set: { value: entity.value, valueType: entity.valueType, updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error('No se pudo guardar el ajuste');
    return this.toDomain(row);
  }

  private toDomain(row: Row): PlatformSetting {
    return PlatformSetting.fromPersistence({
      id: row.id,
      key: row.key,
      value: row.value,
      valueType: row.valueType as SettingValueType,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
    });
  }
}
