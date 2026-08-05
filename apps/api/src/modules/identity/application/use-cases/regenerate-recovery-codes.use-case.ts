import { Inject, Injectable } from '@nestjs/common';
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
import { generateRecoveryCodes } from '../services/recovery-codes';

@Injectable()
export class RegenerateRecoveryCodesUseCase {
  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { userId: string; password: string }): Promise<{ recoveryCodes: string[] }> {
    if (!(await this.mfa.hasActiveFactor(input.userId))) throw new MfaNotEnrolledError();
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();
    if (!user.passwordHash || !(await this.hasher.verify(user.passwordHash, input.password))) {
      throw new InvalidCredentialsError();
    }

    const recoveryCodes = generateRecoveryCodes();
    const hashes = await Promise.all(recoveryCodes.map((code) => this.hasher.hash(code)));
    await this.mfa.replaceRecoveryCodes(user.id, hashes, new Date());
    return { recoveryCodes };
  }
}
