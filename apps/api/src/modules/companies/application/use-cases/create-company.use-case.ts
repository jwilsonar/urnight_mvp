import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateCompanyDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { Company } from '../../domain/entities/company.entity';
import { RucAlreadyRegisteredError } from '../../domain/errors/companies.errors';
import { COMPANY_REPOSITORY, type CompanyRepository } from '../../domain/ports/company.repository';

/** Caso de uso: crear empresa (super_admin). RUC único. */
@Injectable()
export class CreateCompanyUseCase {
  private readonly log = createLogger(CreateCompanyUseCase.name);

  constructor(@Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository) {}

  async execute(dto: CreateCompanyDto): Promise<Company> {
    if (await this.companies.findByRuc(dto.ruc)) {
      this.log.warn({}, 'companies.company.ruc_taken');
      throw new RucAlreadyRegisteredError();
    }
    const company = Company.create({ id: randomUUID(), ...dto });
    const saved = await this.companies.create(company);
    this.log.info({ companyId: saved.id }, 'companies.company.created');
    return saved;
  }
}
