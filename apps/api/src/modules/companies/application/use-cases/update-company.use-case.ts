import { Inject, Injectable } from '@nestjs/common';
import type { UpdateCompanyDto } from '@urnight/contracts';
import type { Company } from '../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../domain/errors/companies.errors';
import { COMPANY_REPOSITORY, type CompanyRepository } from '../../domain/ports/company.repository';

/** Caso de uso: actualizar el perfil de la propia empresa (#29). */
@Injectable()
export class UpdateCompanyUseCase {
  constructor(@Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository) {}

  async execute(input: { companyId: string; dto: UpdateCompanyDto }): Promise<Company> {
    const company = await this.companies.findById(input.companyId);
    if (!company) throw new CompanyNotFoundError();
    company.updateProfile(input.dto);
    return this.companies.update(company);
  }
}
