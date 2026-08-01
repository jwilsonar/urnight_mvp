import { describe, expect, it } from 'vitest';
import { SESSION_IDLE_TIMEOUT_SETTING_KEY, upsertPlatformSettingSchema } from '@urnight/contracts';

describe('session idle timeout platform setting', () => {
  it.each(['5', '30', '1440'])('acepta %s minutos enteros dentro del rango', (value) => {
    expect(
      upsertPlatformSettingSchema.safeParse({
        key: SESSION_IDLE_TIMEOUT_SETTING_KEY,
        value,
        valueType: 'number',
      }).success,
    ).toBe(true);
  });

  it.each([
    { value: '4', valueType: 'number' },
    { value: '1441', valueType: 'number' },
    { value: '5.5', valueType: 'number' },
    { value: '30', valueType: 'string' },
  ] as const)('rechaza un timeout invalido: $value/$valueType', (input) => {
    expect(
      upsertPlatformSettingSchema.safeParse({
        key: SESSION_IDLE_TIMEOUT_SETTING_KEY,
        ...input,
      }).success,
    ).toBe(false);
  });
});
