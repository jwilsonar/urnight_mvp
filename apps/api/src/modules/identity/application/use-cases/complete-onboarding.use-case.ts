import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { UserPreference } from '../../domain/entities/user-preference.entity';
import { PreferenceNotFoundError } from '../../domain/errors/identity.errors';
import {
  USER_PREFERENCE_REPOSITORY,
  type UserPreferenceRepository,
} from '../../domain/ports/user-preference.repository';

/** Caso de uso: marcar el onboarding del usuario como completado. */
@Injectable()
export class CompleteOnboardingUseCase {
  private readonly log = createLogger(CompleteOnboardingUseCase.name);

  constructor(
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferences: UserPreferenceRepository,
  ) {}

  async execute(input: { userId: string }): Promise<UserPreference> {
    this.log.debug({ userId: input.userId }, 'identity.onboarding.started');
    const preference = await this.preferences.findByUser(input.userId);
    if (!preference) throw new PreferenceNotFoundError();

    preference.completeOnboarding();
    const updated = await this.preferences.update(preference);
    this.log.info({ userId: input.userId }, 'identity.onboarding.completed');
    return updated;
  }
}
