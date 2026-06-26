import { randomUUID } from 'node:crypto';
import { User } from '../../../modules/identity/domain/entities/user.entity';
import type { PersonalId } from '../../../modules/identity/domain/value-objects/personal-id.value-object';
import { PersonalIdBuilder } from './personal-id.builder';

/** Builder fluido para el aggregate User (email o Google). */
export class UserBuilder {
  private id: string = randomUUID();
  private fullName = 'Ada Lovelace';
  private email = 'ada@example.com';
  private passwordHash = 'hashed:supersecret';
  private identity: PersonalId = new PersonalIdBuilder().asAdult().build();
  private provider: 'email' | 'google' = 'email';
  private googleSub = 'google-sub-123';
  private avatarUrl: string | null = null;
  private inactive = false;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  withFullName(fullName: string): this {
    this.fullName = fullName;
    return this;
  }

  withPasswordHash(passwordHash: string): this {
    this.passwordHash = passwordHash;
    return this;
  }

  withIdentity(identity: PersonalId): this {
    this.identity = identity;
    return this;
  }

  asGoogle(googleSub = 'google-sub-123'): this {
    this.provider = 'google';
    this.googleSub = googleSub;
    return this;
  }

  asInactive(): this {
    this.inactive = true;
    return this;
  }

  build(): User {
    const user =
      this.provider === 'google'
        ? User.registerWithGoogle({
            id: this.id,
            fullName: this.fullName,
            email: this.email,
            googleSub: this.googleSub,
            avatarUrl: this.avatarUrl,
          })
        : User.registerWithEmail({
            id: this.id,
            fullName: this.fullName,
            email: this.email,
            passwordHash: this.passwordHash,
            identity: this.identity,
          });
    if (this.inactive) user.deactivate();
    return user;
  }
}
