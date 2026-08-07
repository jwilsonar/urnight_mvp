import { createHash, randomInt } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { MfaEmailCodeSentResponse } from '@urnight/contracts';
import { EMAIL_PORT, type EmailPort } from '../../../../shared/adapters/email/email.port';
import { createLogger } from '../../../../shared/logging/logger';
import {
  AccountDisabledError,
  MfaChallengeExpiredError,
  MfaEmailResendTooSoonError,
  MfaEmailUnavailableError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import { MFA_REPOSITORY, type MfaRepository } from '../../domain/ports/mfa.repository';
import { OTP_CODE_STORE, type OtpCodeStore } from '../../domain/ports/otp-code.store';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

const OTP_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class SendMfaEmailCodeUseCase {
  private readonly log = createLogger(SendMfaEmailCodeUseCase.name);

  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(OTP_CODE_STORE) private readonly otp: OtpCodeStore,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
  ) {}

  async execute(input: { challengeId: string }): Promise<MfaEmailCodeSentResponse> {
    const challenge = await this.mfa.findChallenge(input.challengeId);
    if (!challenge) throw new MfaChallengeExpiredError();
    const user = await this.users.findById(challenge.userId);
    if (!user) throw new UserNotFoundError();
    if (!user.isActive) throw new AccountDisabledError();
    if (!user.emailVerified) throw new MfaEmailUnavailableError();

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = createHash('sha256').update(code).digest('hex');
    const issued = await this.otp.issue(input.challengeId, codeHash, OTP_TTL_SECONDS);
    if (!issued) throw new MfaEmailResendTooSoonError();
    const issuedAt = (await this.otp.lastIssuedAt(input.challengeId)) ?? new Date();

    await this.email.send({
      to: user.email,
      subject: 'Tu código de acceso — UrNight',
      body:
        `Tu código de acceso es ${code}. Vence en 10 minutos.\n\n` +
        `Si no intentaste iniciar sesión, cambia tu contraseña.`,
    });
    this.log.info({ userId: user.id }, 'identity.mfa.email_sent');
    return {
      sentTo: maskEmail(user.email),
      expiresAt: new Date(issuedAt.getTime() + OTP_TTL_SECONDS * 1000).toISOString(),
      resendAvailableAt: new Date(
        issuedAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000,
      ).toISOString(),
    };
  }
}

function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
