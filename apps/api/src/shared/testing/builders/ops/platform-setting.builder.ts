import { randomUUID } from 'node:crypto';
import {
  PlatformSetting,
  type SettingValueType,
} from '../../../../modules/ops/domain/entities/platform-setting.entity';

/** Builder fluido para PlatformSetting (delegando en `PlatformSetting.fromPersistence`). */
export class PlatformSettingBuilder {
  private id: string = randomUUID();
  private key = 'feature.checkout_enabled';
  private value = 'true';
  private valueType: SettingValueType = 'boolean';
  private updatedBy: string | null = null;
  private updatedAt = new Date('2026-01-01T00:00:00Z');

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withKey(key: string): this {
    this.key = key;
    return this;
  }

  withValue(value: string): this {
    this.value = value;
    return this;
  }

  withValueType(valueType: SettingValueType): this {
    this.valueType = valueType;
    return this;
  }

  /** Atajo: ajusta value + valueType a la vez. */
  withTypedValue(value: string, valueType: SettingValueType): this {
    this.value = value;
    this.valueType = valueType;
    return this;
  }

  withUpdatedBy(updatedBy: string | null): this {
    this.updatedBy = updatedBy;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this.updatedAt = updatedAt;
    return this;
  }

  build(): PlatformSetting {
    return PlatformSetting.fromPersistence({
      id: this.id,
      key: this.key,
      value: this.value,
      valueType: this.valueType,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt,
    });
  }
}
