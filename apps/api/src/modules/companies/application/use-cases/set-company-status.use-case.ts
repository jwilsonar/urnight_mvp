import { Inject, Injectable } from '@nestjs/common';
import type { Company } from '../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../domain/errors/companies.errors';
import { COMPANY_REPOSITORY, type CompanyRepository } from '../../domain/ports/company.repository';

/** Caso de uso (super_admin): suspender/activar una empresa (#16). */
@Injectable()
export class SetCompanyStatusUseCase {
  constructor(@Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository) {}

  async execute(input: { companyId: string; action: 'suspend' | 'activate' }): Promise<Company> {
    const company = await this.companies.findById(input.companyId);
    if (!company) throw new CompanyNotFoundError();
    if (input.action === 'suspend') company.suspend();
    else company.activate();
    return this.companies.update(company);
  }
}
