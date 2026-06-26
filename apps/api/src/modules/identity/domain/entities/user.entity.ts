import { DocumentLockedError } from '../errors/identity.errors';
import type { PersonalId } from '../value-objects/personal-id.value-object';

export type AuthProvider = 'email' | 'google';

export interface UserProps {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string | null;
  authProvider: AuthProvider;
  googleSub: string | null;
  identity: PersonalId | null;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate root User (§4.1). Concentra invariantes de identidad: mayoría de
 * edad (vía PersonalId), inmutabilidad del documento y estado de cuenta.
 * Núcleo puro — sin NestJS/Drizzle (Dependency Rule §2.2).
 */
export class User {
  private constructor(private readonly props: UserProps) {}

  /** Alta con email + contraseña: requiere identidad documental 18+. */
  static registerWithEmail(input: {
    id: string;
    fullName: string;
    email: string;
    passwordHash: string;
    identity: PersonalId;
    phone?: string | null;
  }): User {
    const now = new Date();
    return new User({
      id: input.id,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      authProvider: 'email',
      googleSub: null,
      identity: input.identity,
      phone: input.phone ?? null,
      avatarUrl: null,
      emailVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Alta federada con Google: email ya verificado por el IdP; documento luego. */
  static registerWithGoogle(input: {
    id: string;
    fullName: string;
    email: string;
    googleSub: string;
    avatarUrl?: string | null;
  }): User {
    const now = new Date();
    return new User({
      id: input.id,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: null,
      authProvider: 'google',
      googleSub: input.googleSub,
      identity: null,
      phone: null,
      avatarUrl: input.avatarUrl ?? null,
      emailVerified: true,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  /** Invariante: el documento es inmutable una vez asignado. */
  assignIdentity(identity: PersonalId): void {
    if (this.props.identity) throw new DocumentLockedError();
    this.props.identity = identity;
    this.touch();
  }

  /** Vincula una cuenta existente (email) con su Google subject al hacer login federado. */
  linkGoogle(googleSub: string): void {
    this.props.googleSub = googleSub;
    this.props.emailVerified = true;
    this.touch();
  }

  markEmailVerified(): void {
    this.props.emailVerified = true;
    this.touch();
  }

  recordLogin(at: Date = new Date()): void {
    this.props.lastLoginAt = at;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string | null {
    return this.props.passwordHash;
  }
  get authProvider(): AuthProvider {
    return this.props.authProvider;
  }
  get googleSub(): string | null {
    return this.props.googleSub;
  }
  get identity(): PersonalId | null {
    return this.props.identity;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }
  get emailVerified(): boolean {
    return this.props.emailVerified;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
