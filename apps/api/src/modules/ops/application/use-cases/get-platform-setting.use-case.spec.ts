import { describe, expect, it } from 'vitest';
import { InMemoryPlatformSettingRepository } from '../../../../shared/testing/in-memory/ops';
import { PlatformSettingMother } from '../../../../shared/testing/mothers/ops';
import { SettingNotFoundError } from '../../domain/errors/ops.errors';
import { GetPlatformSettingUseCase } from './get-platform-setting.use-case';

function build() {
  const settings = new InMemoryPlatformSettingRepository();
  const useCase = new GetPlatformSettingUseCase(settings);
  return { settings, useCase };
}

describe('GetPlatformSettingUseCase', () => {
  it('devuelve el ajuste cuando la key existe', async () => {
    const { settings, useCase } = build();
    settings.seed(PlatformSettingMother.booleanSetting());

    const result = await useCase.execute('feature.checkout_enabled');

    expect(result.key).toBe('feature.checkout_enabled');
    expect(result.valueType).toBe('boolean');
  });

  it('key inexistente → SettingNotFoundError', async () => {
    const { useCase } = build();
    await expect(useCase.execute('no.existe')).rejects.toBeInstanceOf(SettingNotFoundError);
  });
});
