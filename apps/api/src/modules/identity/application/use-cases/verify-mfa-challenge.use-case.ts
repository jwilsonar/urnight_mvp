import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import {
  MfaChallengeExpiredError,
  MfaNotEnrolledError,
} from '../../domain/errors/identity.errors';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';
import { TOTP_PORT, type TotpPort } from '../../domain/ports/totp.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { completeMfaSession } from '../services/complete-mfa-session';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';
import { assertTotpCode } from '../services/totp-verification';

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
    assertTotpCode(this.totp, this.log, {
      userId: challenge.userId,
      secret: factor.secret,
      code: input.code,
    });

    const result = await completeMfaSession(challenge, {
      mfa: this.mfa,
      users: this.users,
      issuer: this.issuer,
      factorId: factor.id,
    });
    this.log.info({ userId: challenge.userId }, 'identity.mfa.verified');
    return result;
  }
}
