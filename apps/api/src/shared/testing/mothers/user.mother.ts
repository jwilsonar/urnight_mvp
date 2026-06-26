import type { User } from '../../../modules/identity/domain/entities/user.entity';
import { UserBuilder } from '../builders/user.builder';

/** Casos predefinidos de User. */
export const UserMother = {
  valid: (): User => new UserBuilder().build(),
  adult: (): User => new UserBuilder().build(),
  google: (): User => new UserBuilder().asGoogle().build(),
  inactive: (): User => new UserBuilder().asInactive().build(),
};
