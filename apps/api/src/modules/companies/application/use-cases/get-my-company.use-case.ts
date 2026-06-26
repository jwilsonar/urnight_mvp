import { Inject, Injectable } from '@nestjs/common';
import type { Company } from '../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../domain/errors/companies.errors';
import { COMPANY_REPOSITORY, type CompanyRepository } from '../../domain/ports/company.repository';

/** Caso de uso: empresa del actor autenticado (#2/#29). */
@Injectable()
export class GetMyCompanyUseCase {
  constructor(@Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository) {}

  async execute(input: { companyId: string }): Promise<Company> {
    const company = await this.companies.findById(input.companyId);
    if (!company) throw new CompanyNotFoundError();
    return company;
  }
}
