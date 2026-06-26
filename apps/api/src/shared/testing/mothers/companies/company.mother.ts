import type { Company } from '../../../../modules/companies/domain/entities/company.entity';
import { CompanyBuilder } from '../../builders/companies/company.builder';

/** Casos predefinidos de Company. */
export const CompanyMother = {
  valid: (): Company => new CompanyBuilder().build(),
  active: (): Company => new CompanyBuilder().build(),
  suspended: (): Company => new CompanyBuilder().suspended().build(),
};
