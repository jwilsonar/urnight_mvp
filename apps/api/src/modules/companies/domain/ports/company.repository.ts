import type { Company } from '../entities/company.entity';

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  findByRuc(ruc: string): Promise<Company | null>;
  /** Todas las empresas (super_admin, #16). */
  list(): Promise<Company[]>;
  create(company: Company, tx?: unknown): Promise<Company>;
  update(company: Company): Promise<Company>;
}

export const COMPANY_REPOSITORY = Symbol('COMPANY_REPOSITORY');
