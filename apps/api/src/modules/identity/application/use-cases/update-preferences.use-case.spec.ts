import { describe, expect, it } from 'vitest';
import {
  InMemoryUserPreferenceRepository,
  UserPreferenceBuilder,
} from '../../../../shared/testing';
import { PreferenceNotFoundError } from '../../domain/errors/identity.errors';
import { UpdatePreferencesUseCase } from './update-preferences.use-case';

function build() {
  const preferences = new InMemoryUserPreferenceRepository();
  const useCase = new UpdatePreferencesUseCase(preferences);
  return { preferences, useCase };
}

describe('UpdatePreferencesUseCase', () => {
  it('aplica el patch y persiste', async () => {
    const { preferences, useCase } = build();
    await preferences.create(new UserPreferenceBuilder().withUserId('u1').build());

    const result = await useCase.execute({
      userId: 'u1',
      patch: { acceptsMarketing: true, preferredLocale: 'es-MX' },
    });

    expect(result.acceptsMarketing).toBe(true);
    expect(result.preferredLocale).toBe('es-MX');
  });

  it('preferencias inexistentes → PreferenceNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ userId: 'ghost', patch: { acceptsMarketing: false } }),
    ).rejects.toBeInstanceOf(PreferenceNotFoundError);
  });
});
