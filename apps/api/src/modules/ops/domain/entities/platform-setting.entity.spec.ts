import { describe, expect, it } from 'vitest';
import { PlatformSetting, type SettingValueType } from './platform-setting.entity';
import { PlatformSettingBuilder } from '../../../../shared/testing/builders/ops';
import { PlatformSettingMother } from '../../../../shared/testing/mothers/ops';

describe('PlatformSetting (domain §4.1)', () => {
  it('crea un ajuste con value tipado y updatedBy explícito', () => {
    const setting = PlatformSetting.create({
      id: 's1',
      key: 'feature.checkout_enabled',
      value: 'true',
      valueType: 'boolean',
      updatedBy: 'admin-1',
    });
    expect(setting.key).toBe('feature.checkout_enabled');
    expect(setting.value).toBe('true');
    expect(setting.valueType).toBe('boolean');
    expect(setting.updatedAt).toBeInstanceOf(Date);
  });

  it('por defecto updatedBy es null cuando no se indica', () => {
    const setting = PlatformSetting.create({
      id: 's1',
      key: 'branding.support_email',
      value: 'soporte@urnight.com',
      valueType: 'string',
    });
    expect(setting.value).toBe('soporte@urnight.com');
    expect(setting.valueType).toBe('string');
  });

  it('reconstituye desde persistencia conservando todos sus campos', () => {
    const updatedAt = new Date('2026-02-02T10:00:00Z');
    const setting = PlatformSetting.fromPersistence({
      id: 's1',
      key: 'checkout.max_tickets',
      value: '10',
      valueType: 'number',
      updatedBy: 'admin-1',
      updatedAt,
    });
    expect(setting.key).toBe('checkout.max_tickets');
    expect(setting.value).toBe('10');
    expect(setting.valueType).toBe('number');
    expect(setting.updatedAt).toBe(updatedAt);
  });

  // Invariante §4.1: el value siempre se almacena como string discriminado por
  // valueType (string|number|boolean|json). Verifica el tipado de cada variante.
  const variants: Array<{ valueType: SettingValueType; value: string }> = [
    { valueType: 'string', value: 'soporte@urnight.com' },
    { valueType: 'number', value: '42' },
    { valueType: 'boolean', value: 'true' },
    { valueType: 'json', value: '{"culqi":true}' },
  ];

  for (const { valueType, value } of variants) {
    it(`conserva el value como string para valueType="${valueType}"`, () => {
      const setting = PlatformSetting.create({ id: 's', key: `k.${valueType}`, value, valueType });
      expect(setting.value).toBe(value);
      expect(typeof setting.value).toBe('string');
      expect(setting.valueType).toBe(valueType);
    });
  }

  it('el builder produce el ajuste boolean por defecto', () => {
    const setting = new PlatformSettingBuilder().build();
    expect(setting.key).toBe('feature.checkout_enabled');
    expect(setting.valueType).toBe('boolean');
  });

  it('los mothers exponen una variante por cada valueType del MVP', () => {
    expect(PlatformSettingMother.stringSetting().valueType).toBe('string');
    expect(PlatformSettingMother.numberSetting().valueType).toBe('number');
    expect(PlatformSettingMother.booleanSetting().valueType).toBe('boolean');
    expect(PlatformSettingMother.jsonSetting().valueType).toBe('json');
  });
});
