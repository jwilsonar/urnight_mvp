import type { UpsertPlatformSettingDto } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { InMemoryPlatformSettingRepository } from '../../../../shared/testing/in-memory/ops';
import { UpsertPlatformSettingUseCase } from './upsert-platform-setting.use-case';

function build() {
  const settings = new InMemoryPlatformSettingRepository();
  const useCase = new UpsertPlatformSettingUseCase(settings);
  return { settings, useCase };
}

const dto = (over: Partial<UpsertPlatformSettingDto> = {}): UpsertPlatformSettingDto => ({
  key: 'feature.checkout_enabled',
  value: 'true',
  valueType: 'boolean',
  ...over,
});

describe('UpsertPlatformSettingUseCase', () => {
  it('crea un ajuste nuevo y persiste su estado', async () => {
    const { settings, useCase } = build();

    const result = await useCase.execute({ dto: dto(), updatedBy: 'admin-1' });

    expect(result.key).toBe('feature.checkout_enabled');
    expect(result.value).toBe('true');
    expect(result.valueType).toBe('boolean');
    expect(settings.size).toBe(1);
    expect((await settings.findByKey('feature.checkout_enabled'))?.value).toBe('true');
  });

  // Invariante §4.1: la key es única (upsert por key). Reescribir la misma key
  // actualiza en lugar de duplicar.
  it('upsert sobre una key existente actualiza sin duplicar (unicidad de key)', async () => {
    const { settings, useCase } = build();
    await useCase.execute({ dto: dto({ value: 'true' }), updatedBy: 'admin-1' });

    await useCase.execute({ dto: dto({ value: 'false' }), updatedBy: 'admin-2' });

    expect(settings.size).toBe(1);
    expect((await settings.findByKey('feature.checkout_enabled'))?.value).toBe('false');
  });

  // Invariante §4.1: cada valueType (string|number|boolean|json) se almacena tipado.
  it('preserva el valueType="number" provisto en el DTO', async () => {
    const { useCase } = build();
    const result = await useCase.execute({
      dto: dto({ key: 'checkout.max_tickets', value: '10', valueType: 'number' }),
      updatedBy: 'admin-1',
    });
    expect(result.valueType).toBe('number');
    expect(result.value).toBe('10');
  });

  it('preserva el valueType="json" provisto en el DTO', async () => {
    const { useCase } = build();
    const result = await useCase.execute({
      dto: dto({ key: 'payments.gateways', value: '{"culqi":true}', valueType: 'json' }),
      updatedBy: 'admin-1',
    });
    expect(result.valueType).toBe('json');
  });

  it('persiste el ajuste a través del repositorio (upsert)', async () => {
    const { settings, useCase } = build();
    await useCase.execute({ dto: dto({ key: 'a.b' }), updatedBy: 'admin-1' });
    expect(settings.all.map((s) => s.key)).toEqual(['a.b']);
  });
});
