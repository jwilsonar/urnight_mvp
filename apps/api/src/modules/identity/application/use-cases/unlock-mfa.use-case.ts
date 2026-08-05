import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { RoleCode } from '../../domain/entities/role.entity';
import { MfaNotEnrolledError } from '../../domain/errors/identity.errors';
import {
  MFA_REPOSITORY,
  type MfaRepository,
} from '../../domain/ports/mfa.repository';

@Injectable()
export class UnlockMfaUseCase {
  private readonly log = createLogger(UnlockMfaUseCase.name);

  constructor(@Inject(MFA_REPOSITORY) private readonly mfa: MfaRepository) {}

  async execute(input: {
    actorUserId: string;
    actorRoles: RoleCode[];
    targetUserId: string;
    reason: string;
  }): Promise<void> {
    const isSuperAdmin = input.actorRoles.includes('super_admin');
    const isOperator = await this.mfa.isUnlockOperator(input.actorUserId);
    if (!isSuperAdmin || !isOperator) {
      throw new ForbiddenException('No estás autorizado para desbloquear MFA');
    }
    if (!(await this.mfa.revokeForUser(input.targetUserId, new Date()))) {
      throw new MfaNotEnrolledError();
    }
    this.log.info(
      {
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        reason: input.reason,
      },
      'identity.mfa.unlocked',
    );
  }
}
