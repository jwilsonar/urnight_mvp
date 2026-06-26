import { Inject, Injectable } from '@nestjs/common';
import type { UpdatePreferenceDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import type { UserPreference } from '../../domain/entities/user-preference.entity';
import { PreferenceNotFoundError } from '../../domain/errors/identity.errors';
import {
  USER_PREFERENCE_REPOSITORY,
  type UserPreferenceRepository,
} from '../../domain/ports/user-preference.repository';

/** Caso de uso: actualizar preferencias (marketing, recordatorios, locale). */
@Injectable()
export class UpdatePreferencesUseCase {
  private readonly log = createLogger(UpdatePreferencesUseCase.name);

  constructor(
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferences: UserPreferenceRepository,
  ) {}

  async execute(input: { userId: string; patch: UpdatePreferenceDto }): Promise<UserPreference> {
    const preference = await this.preferences.findByUser(input.userId);
    if (!preference) throw new PreferenceNotFoundError();

    preference.update(input.patch);
    const updated = await this.preferences.update(preference);
    this.log.info({ userId: input.userId }, 'identity.preferences.updated');
    return updated;
  }
}
