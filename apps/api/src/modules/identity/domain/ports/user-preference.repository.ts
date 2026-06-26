import type { UserPreference } from '../entities/user-preference.entity';

/** Puerto del repositorio de preferencias (1:1 con User). */
export interface UserPreferenceRepository {
  findByUser(userId: string): Promise<UserPreference | null>;
  create(preference: UserPreference, tx?: unknown): Promise<UserPreference>;
  update(preference: UserPreference): Promise<UserPreference>;
}

export const USER_PREFERENCE_REPOSITORY = Symbol('USER_PREFERENCE_REPOSITORY');
