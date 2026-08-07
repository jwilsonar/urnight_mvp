import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import {
  MfaAlreadyEnrolledError,
  MfaNotEnrolledError,
} from '../../domain/errors/identity.errors';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TOTP_PORT, type TotpPort } from '../../domain/ports/totp.port';
import { generateRecoveryCodes } from '../services/recovery-codes';
import { assertTotpCode } from '../services/totp-verification';

@Injectable()
export class ConfirmMfaEnrollmentUseCase {
  private readonly log = createLogger(ConfirmMfaEnrollmentUseCase.name);

  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    @Inject(TOTP_PORT) private readonly totp: TotpPort,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { userId: string; code: string }): Promise<{ recoveryCodes: string[] }> {
    const factor = await this.mfa.findCurrentFactor(input.userId);
    if (factor?.status === 'active') throw new MfaAlreadyEnrolledError();
    if (!factor || factor.status !== 'pending') throw new MfaNotEnrolledError();
    assertTotpCode(this.totp, this.log, {
      userId: input.userId,
      secret: factor.secret,
      code: input.code,
    });

    const recoveryCodes = generateRecoveryCodes();
    const codeHashes = await Promise.all(recoveryCodes.map((code) => this.hasher.hash(code)));
    await this.mfa.confirmEnrollment({
      factorId: factor.id,
      userId: input.userId,
      codeHashes,
      confirmedAt: new Date(),
    });
    this.log.info({ userId: input.userId }, 'identity.mfa.confirmed');
    return { recoveryCodes };
  }
}
