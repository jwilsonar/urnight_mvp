import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import type { Local } from '../../domain/entities/local.entity';
import { LocalNotFoundError, TenantForbiddenError } from '../../domain/errors/companies.errors';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

/** Caso de uso: suspender local (super_admin / admin_local dueño). */
@Injectable()
export class SuspendLocalUseCase {
  private readonly log = createLogger(SuspendLocalUseCase.name);

  constructor(@Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository) {}

  async execute(input: {
    localId: string;
    reason: string;
    isSuperAdmin: boolean;
    actorCompanyId?: string | null;
  }): Promise<Local> {
    const local = await this.locals.findById(input.localId);
    if (!local) {
      this.log.warn({ localId: input.localId }, 'companies.local.not_found');
      throw new LocalNotFoundError();
    }
    if (!input.isSuperAdmin && input.actorCompanyId !== local.companyId) {
      throw new TenantForbiddenError();
    }
    local.suspend(input.reason);
    const saved = await this.locals.update(local);
    this.log.info({ localId: saved.id }, 'companies.local.suspended');
    return saved;
  }
}
