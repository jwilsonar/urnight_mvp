import { randomUUID } from 'node:crypto';
import { UserPreference } from '../../../modules/identity/domain/entities/user-preference.entity';

/** Builder fluido para UserPreference (createDefault). */
export class UserPreferenceBuilder {
  private id: string = randomUUID();
  private userId: string = randomUUID();
  private acceptsMarketing = false;
  private preferredLocale = 'es-PE';

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  withMarketing(acceptsMarketing: boolean): this {
    this.acceptsMarketing = acceptsMarketing;
    return this;
  }

  withLocale(preferredLocale: string): this {
    this.preferredLocale = preferredLocale;
    return this;
  }

  build(): UserPreference {
    return UserPreference.createDefault({
      id: this.id,
      userId: this.userId,
      acceptsMarketing: this.acceptsMarketing,
      preferredLocale: this.preferredLocale,
    });
  }
}
