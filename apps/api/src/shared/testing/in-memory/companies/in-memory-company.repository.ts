import type { Company } from '../../../../modules/companies/domain/entities/company.entity';
import type { CompanyRepository } from '../../../../modules/companies/domain/ports/company.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** CompanyRepository en memoria. Replica las búsquedas del adapter Drizzle. */
export class InMemoryCompanyRepository
  extends InMemoryRepository<Company>
  implements CompanyRepository
{
  async findById(id: string): Promise<Company | null> {
    return this.getById(id);
  }

  async findByRuc(ruc: string): Promise<Company | null> {
    return this.values().find((c) => c.ruc === ruc) ?? null;
  }

  async list(): Promise<Company[]> {
    return this.values();
  }

  async create(company: Company, _tx?: unknown): Promise<Company> {
    this.put(company);
    return company;
  }

  async update(company: Company): Promise<Company> {
    this.put(company);
    return company;
  }
}
