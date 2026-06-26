import { describe, expect, it } from 'vitest';
import {
  InMemoryUserPreferenceRepository,
  UserPreferenceBuilder,
} from '../../../../shared/testing';
import { PreferenceNotFoundError } from '../../domain/errors/identity.errors';
import { CompleteOnboardingUseCase } from './complete-onboarding.use-case';

function build() {
  const preferences = new InMemoryUserPreferenceRepository();
  const useCase = new CompleteOnboardingUseCase(preferences);
  return { preferences, useCase };
}

describe('CompleteOnboardingUseCase', () => {
  it('marca el onboarding como completado y persiste', async () => {
    const { preferences, useCase } = build();
    await preferences.create(new UserPreferenceBuilder().withUserId('u1').build());

    const result = await useCase.execute({ userId: 'u1' });

    expect(result.onboardingCompleted).toBe(true);
    expect((await preferences.findByUser('u1'))?.onboardingCompleted).toBe(true);
  });

  it('preferencias inexistentes → PreferenceNotFoundError', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ userId: 'ghost' })).rejects.toBeInstanceOf(
      PreferenceNotFoundError,
    );
  });
});
