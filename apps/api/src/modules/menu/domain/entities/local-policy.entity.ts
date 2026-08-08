import { MenuDepositPercentInvalidError } from '../errors/menu.errors';

export interface LocalPolicyProps {
  id: string;
  localId: string;
  reservationDepositPercent: number;
  birthdayWindowDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export class LocalPolicy {
  private constructor(private readonly props: LocalPolicyProps) {}

  static create(
    input: Pick<
      LocalPolicyProps,
      'id' | 'localId' | 'reservationDepositPercent' | 'birthdayWindowDays'
    > &
      Partial<Pick<LocalPolicyProps, 'createdAt' | 'updatedAt'>>,
  ): LocalPolicy {
    LocalPolicy.assertDepositPercent(input.reservationDepositPercent);
    const now = input.createdAt ?? new Date();
    return new LocalPolicy({
      ...input,
      createdAt: now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static fromPersistence(props: LocalPolicyProps): LocalPolicy {
    return new LocalPolicy(props);
  }

  update(
    input: Pick<LocalPolicyProps, 'reservationDepositPercent' | 'birthdayWindowDays'>,
    now = new Date(),
  ): void {
    LocalPolicy.assertDepositPercent(input.reservationDepositPercent);
    this.props.reservationDepositPercent = input.reservationDepositPercent;
    this.props.birthdayWindowDays = input.birthdayWindowDays;
    this.props.updatedAt = now;
  }

  private static assertDepositPercent(percent: number): void {
    if (!Number.isInteger(percent) || percent < 0 || percent > 100 || percent % 5 !== 0) {
      throw new MenuDepositPercentInvalidError();
    }
  }

  get id(): string {
    return this.props.id;
  }
  get localId(): string {
    return this.props.localId;
  }
  get reservationDepositPercent(): number {
    return this.props.reservationDepositPercent;
  }
  get birthdayWindowDays(): number {
    return this.props.birthdayWindowDays;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
