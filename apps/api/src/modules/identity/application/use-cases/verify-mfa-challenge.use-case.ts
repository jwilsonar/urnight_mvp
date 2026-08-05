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
import { TOTP_PORT, type TotpPort } from '../../domain/ports/totp.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

@Injectable()
export class VerifyMfaChallengeUseCase {
  private readonly log = createLogger(VerifyMfaChallengeUseCase.name);

  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    @Inject(TOTP_PORT) private readonly totp: TotpPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly issuer: TokenIssuer,
  ) {}

  async execute(input: { challengeId: string; code: string }): Promise<AuthResult> {
    const challenge = await this.mfa.findChallenge(input.challengeId);
    if (!challenge) throw new MfaChallengeExpiredError();
    const factor = await this.mfa.findActiveFactor(challenge.userId);
    if (!factor) throw new MfaNotEnrolledError();
    if (!this.totp.verify(factor.secret, input.code)) {
      this.log.warn({ userId: challenge.userId }, 'identity.mfa.failed');
      throw new InvalidMfaCodeError();
    }

    const consumed = await this.mfa.consumeChallenge(challenge.id, challenge.userId);
    if (!consumed) throw new MfaChallengeExpiredError();
    const user = await this.users.findById(challenge.userId);
    if (!user) throw new UserNotFoundError();
    if (!user.isActive) throw new AccountDisabledError();
    await this.mfa.markFactorUsed(factor.id, new Date());
    const result = await this.issuer.issueFor(user);
    this.log.info({ userId: user.id }, 'identity.mfa.verified');
    return result;
  }
}
