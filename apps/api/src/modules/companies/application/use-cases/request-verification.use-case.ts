import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RequestVerificationDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { LocalVerification } from '../../domain/entities/local-verification.entity';
import { LocalNotFoundError, TenantForbiddenError } from '../../domain/errors/companies.errors';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';
import {
  LOCAL_VERIFICATION_REPOSITORY,
  type LocalVerificationRepository,
} from '../../domain/ports/local-verification.repository';

/** Caso de uso: solicitar verificación de un local. */
@Injectable()
export class RequestVerificationUseCase {
  private readonly log = createLogger(RequestVerificationUseCase.name);

  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    @Inject(LOCAL_VERIFICATION_REPOSITORY)
    private readonly verifications: LocalVerificationRepository,
  ) {}

  async execute(input: {
    localId: string;
    dto: RequestVerificationDto;
    isSuperAdmin: boolean;
    actorCompanyId?: string | null;
  }): Promise<LocalVerification> {
    const local = await this.locals.findById(input.localId);
    if (!local) {
      this.log.warn({ localId: input.localId }, 'companies.verification.local_not_found');
      throw new LocalNotFoundError();
    }
    if (!input.isSuperAdmin && input.actorCompanyId !== local.companyId) {
      throw new TenantForbiddenError();
    }
    const verification = LocalVerification.request({
      id: randomUUID(),
      localId: local.id,
      ...input.dto,
    });
    const saved = await this.verifications.create(verification);
    this.log.info({ localId: local.id }, 'companies.verification.requested');
    return saved;
  }
}
