import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import {
  AccountDisabledError,
  InvalidMfaCodeError,
  MfaChallengeExpiredError,
  MfaNotEnrolledError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

@Injectable()
export class UseRecoveryCodeUseCase {
  private readonly log = createLogger(UseRecoveryCodeUseCase.name);

  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    private readonly hasher: PasswordHasher,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly issuer: TokenIssuer,
  ) {}

  async execute(input: { challengeId: string; recoveryCode: string }): Promise<AuthResult> {
    const challenge = await this.mfa.findChallenge(input.challengeId);
    if (!challenge) throw new MfaChallengeExpiredError();
    if (!(await this.mfa.hasActiveFactor(challenge.userId))) throw new MfaNotEnrolledError();

    const unused = await this.mfa.listUnusedRecoveryCodes(challenge.userId);
    // Verifica todos los hashes para que la posición del código no altere el tiempo de respuesta.
    const matches = await Promise.all(
      unused.map((candidate) => this.hasher.verify(candidate.codeHash, input.recoveryCode)),
    );
    const matchedId = unused[matches.findIndex(Boolean)]?.id ?? null;
    if (!matchedId || !(await this.mfa.consumeRecoveryCode(matchedId, new Date()))) {
      this.log.warn({ userId: challenge.userId }, 'identity.mfa.failed');
      throw new InvalidMfaCodeError();
    }
    if (!(await this.mfa.consumeChallenge(challenge.id, challenge.userId))) {
      throw new MfaChallengeExpiredError();
    }

    const user = await this.users.findById(challenge.userId);
    if (!user) throw new UserNotFoundError();
    if (!user.isActive) throw new AccountDisabledError();
    const result = await this.issuer.issueFor(user);
    this.log.info({ userId: user.id }, 'identity.mfa.recovery_used');
    return result;
  }
}
