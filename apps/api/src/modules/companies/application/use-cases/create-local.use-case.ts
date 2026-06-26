import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateLocalDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { Local } from '../../domain/entities/local.entity';
import {
  CompanyNotFoundError,
  LocalSlugTakenError,
  TenantForbiddenError,
} from '../../domain/errors/companies.errors';
import { COMPANY_REPOSITORY, type CompanyRepository } from '../../domain/ports/company.repository';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

export interface CreateLocalInput extends CreateLocalDto {
  isSuperAdmin: boolean;
  actorCompanyId?: string | null;
}

/** Caso de uso: crear local (admin_local en su empresa, o super_admin). */
@Injectable()
export class CreateLocalUseCase {
  private readonly log = createLogger(CreateLocalUseCase.name);

  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository,
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
  ) {}

  async execute(input: CreateLocalInput): Promise<Local> {
    if (!input.isSuperAdmin && input.actorCompanyId !== input.companyId) {
      throw new TenantForbiddenError();
    }
    const company = await this.companies.findById(input.companyId);
    if (!company) {
      this.log.warn({ companyId: input.companyId }, 'companies.local.company_not_found');
      throw new CompanyNotFoundError();
    }
    if (await this.locals.existsBySlug(input.slug)) {
      this.log.warn({ companyId: input.companyId }, 'companies.local.slug_taken');
      throw new LocalSlugTakenError();
    }

    // El DTO trae mainImageUrl (URL absoluta opcional); en dominio es la ref de
    // portada (mainImageKey). Una URL absoluta se resuelve por passthrough.
    const local = Local.create({ id: randomUUID(), ...input, mainImageKey: input.mainImageUrl });
    const saved = await this.locals.create(local);
    this.log.info({ localId: saved.id, companyId: saved.companyId }, 'companies.local.created');
    return saved;
  }
}
