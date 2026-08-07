import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import {
  MfaChallengeExpiredError,
  MfaEmailCodeExpiredError,
  MfaEmailCodeInvalidError,
} from '../../domain/errors/identity.errors';
import { MFA_REPOSITORY, type MfaRepository } from '../../domain/ports/mfa.repository';
import { OTP_CODE_STORE, type OtpCodeStore } from '../../domain/ports/otp-code.store';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { completeMfaSession } from '../services/complete-mfa-session';
import { TokenIssuer, type AuthResult } from '../services/token-issuer.service';

@Injectable()
export class VerifyMfaEmailCodeUseCase {
  private readonly log = createLogger(VerifyMfaEmailCodeUseCase.name);

  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(OTP_CODE_STORE) private readonly otp: OtpCodeStore,
    private readonly issuer: TokenIssuer,
  ) {}

  async execute(input: { challengeId: string; code: string }): Promise<AuthResult> {
    const challenge = await this.mfa.findChallenge(input.challengeId);
    if (!challenge) throw new MfaChallengeExpiredError();
    const codeHash = createHash('sha256').update(input.code).digest('hex');
    const result = await this.otp.consume(input.challengeId, codeHash);
    if (result === 'expired') throw new MfaEmailCodeExpiredError();
    if (result === 'invalid') {
      this.log.warn({ userId: challenge.userId }, 'identity.mfa.email_failed');
      throw new MfaEmailCodeInvalidError();
    }

    const session = await completeMfaSession(challenge, {
      mfa: this.mfa,
      users: this.users,
      issuer: this.issuer,
    });
    this.log.info({ userId: challenge.userId }, 'identity.mfa.email_verified');
    return session;
  }
}
