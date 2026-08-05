import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createLogger } from '../../../../shared/logging/logger';
import {
  MfaAlreadyEnrolledError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';
import { TOTP_PORT, type TotpPort } from '../../domain/ports/totp.port';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';

@Injectable()
export class StartMfaEnrollmentUseCase {
  private readonly log = createLogger(StartMfaEnrollmentUseCase.name);

  constructor(
    @Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository,
    @Inject(TOTP_PORT) private readonly totp: TotpPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: { userId: string }): Promise<{ otpauthUri: string; secret: string }> {
    const existing = await this.mfa.findCurrentFactor(input.userId);
    if (existing?.status === 'active') throw new MfaAlreadyEnrolledError();
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();

    const secret = this.totp.generateSecret();
    await this.mfa.replacePendingFactor({
      id: randomUUID(),
      userId: user.id,
      secret,
      createdAt: new Date(),
    });
    this.log.info({ userId: user.id }, 'identity.mfa.enrolled');
    return {
      otpauthUri: this.totp.buildOtpAuthUri(secret, user.email),
      secret,
    };
  }
}
