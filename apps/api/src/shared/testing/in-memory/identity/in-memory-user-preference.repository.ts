import type { UserPreference } from '../../../../modules/identity/domain/entities/user-preference.entity';
import type { UserPreferenceRepository } from '../../../../modules/identity/domain/ports/user-preference.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** UserPreferenceRepository en memoria (1:1 con User). */
export class InMemoryUserPreferenceRepository
  extends InMemoryRepository<UserPreference>
  implements UserPreferenceRepository
{
  async findByUser(userId: string): Promise<UserPreference | null> {
    return this.values().find((p) => p.userId === userId) ?? null;
  }

  async create(preference: UserPreference, _tx?: unknown): Promise<UserPreference> {
    this.put(preference);
    return preference;
  }

  async update(preference: UserPreference): Promise<UserPreference> {
    this.put(preference);
    return preference;
  }
}
