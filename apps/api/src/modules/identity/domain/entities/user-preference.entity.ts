export interface UserPreferenceProps {
  id: string;
  userId: string;
  onboardingCompleted: boolean;
  acceptsMarketing: boolean;
  acceptsReminders: boolean;
  preferredLocale: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Preferencias + estado de onboarding del usuario (§4.1). 1:1 con User. */
export class UserPreference {
  private constructor(private readonly props: UserPreferenceProps) {}

  /** Crea las preferencias por defecto al registrar un usuario. */
  static createDefault(input: {
    id: string;
    userId: string;
    acceptsMarketing?: boolean;
    preferredLocale?: string;
  }): UserPreference {
    const now = new Date();
    return new UserPreference({
      id: input.id,
      userId: input.userId,
      onboardingCompleted: false,
      acceptsMarketing: input.acceptsMarketing ?? false,
      acceptsReminders: true,
      preferredLocale: input.preferredLocale ?? 'es-PE',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserPreferenceProps): UserPreference {
    return new UserPreference(props);
  }

  completeOnboarding(): void {
    this.props.onboardingCompleted = true;
    this.touch();
  }

  update(patch: {
    acceptsMarketing?: boolean;
    acceptsReminders?: boolean;
    preferredLocale?: string;
  }): void {
    if (patch.acceptsMarketing !== undefined) this.props.acceptsMarketing = patch.acceptsMarketing;
    if (patch.acceptsReminders !== undefined) this.props.acceptsReminders = patch.acceptsReminders;
    if (patch.preferredLocale !== undefined) this.props.preferredLocale = patch.preferredLocale;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get onboardingCompleted(): boolean {
    return this.props.onboardingCompleted;
  }
  get acceptsMarketing(): boolean {
    return this.props.acceptsMarketing;
  }
  get acceptsReminders(): boolean {
    return this.props.acceptsReminders;
  }
  get preferredLocale(): string {
    return this.props.preferredLocale;
  }
}
