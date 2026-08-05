import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import {
  InvalidCredentialsError,
  MfaNotEnrolledError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

@Injectable()
export class RevokeMfaUseCase {
  private readonly log = createLogger(RevokeMfaUseCase.name);

  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { userId: string; password: string }): Promise<void> {
    if (!(await this.mfa.hasActiveFactor(input.userId))) throw new MfaNotEnrolledError();
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();
    if (!user.passwordHash || !(await this.hasher.verify(user.passwordHash, input.password))) {
      throw new InvalidCredentialsError();
    }
    await this.mfa.revokeForUser(user.id, new Date());
    this.log.info({ userId: user.id }, 'identity.mfa.revoked');
  }
}
