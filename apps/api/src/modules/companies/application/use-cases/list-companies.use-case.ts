import { Inject, Injectable } from '@nestjs/common';
import type { Company } from '../../domain/entities/company.entity';
import { COMPANY_REPOSITORY, type CompanyRepository } from '../../domain/ports/company.repository';

/** Caso de uso (super_admin): listar todas las empresas (#16). */
@Injectable()
export class ListCompaniesUseCase {
  constructor(@Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository) {}

  execute(): Promise<Company[]> {
    return this.companies.list();
  }
}
