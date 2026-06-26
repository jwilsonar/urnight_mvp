import { describe, expect, it } from 'vitest';
import { InMemoryCompanyRepository } from '../../../../shared/testing/in-memory/companies';
import { CompanyBuilder } from '../../../../shared/testing/builders/companies';
import { RucAlreadyRegisteredError } from '../../domain/errors/companies.errors';
import { CreateCompanyUseCase } from './create-company.use-case';

function build() {
  const companies = new InMemoryCompanyRepository();
  const useCase = new CreateCompanyUseCase(companies);
  return { companies, useCase };
}

const dto = {
  legalName: 'Discoteca Aurora S.A.C.',
  ruc: '20512345678',
  commercialName: 'Aurora Club',
};

describe('CreateCompanyUseCase', () => {
  it('crea una empresa activa y la persiste con RUC único', async () => {
    const { companies, useCase } = build();

    const company = await useCase.execute(dto);

    expect(company.ruc).toBe('20512345678');
    expect(company.legalName).toBe('Discoteca Aurora S.A.C.');
    expect(company.status).toBe('active');
    expect(companies.size).toBe(1);
    expect(await companies.findByRuc('20512345678')).not.toBeNull();
  });

  it('RUC ya registrado → RucAlreadyRegisteredError (unicidad de RUC)', async () => {
    const { companies, useCase } = build();
    await companies.create(new CompanyBuilder().withRuc('20512345678').build());

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(RucAlreadyRegisteredError);
    expect(companies.size).toBe(1);
  });
});
