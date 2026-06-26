export type SettingValueType = 'string' | 'number' | 'boolean' | 'json';

export interface PlatformSettingProps {
  id: string;
  key: string;
  value: string;
  valueType: SettingValueType;
  updatedBy: string | null;
  updatedAt: Date;
}

/** Ajuste de plataforma (§4.1). key→value tipado. */
export class PlatformSetting {
  private constructor(private readonly props: PlatformSettingProps) {}

  static create(input: {
    id: string;
    key: string;
    value: string;
    valueType: SettingValueType;
    updatedBy?: string | null;
  }): PlatformSetting {
    return new PlatformSetting({
      id: input.id,
      key: input.key,
      value: input.value,
      valueType: input.valueType,
      updatedBy: input.updatedBy ?? null,
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: PlatformSettingProps): PlatformSetting {
    return new PlatformSetting(props);
  }

  get key(): string {
    return this.props.key;
  }
  get value(): string {
    return this.props.value;
  }
  get valueType(): SettingValueType {
    return this.props.valueType;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
