import { describe, expect, it } from 'vitest';
import {
  InMemoryCompanyRepository,
  InMemoryLocalRepository,
} from '../../../../shared/testing/in-memory/companies';
import { CompanyBuilder, LocalBuilder } from '../../../../shared/testing/builders/companies';
import {
  CompanyNotFoundError,
  LocalSlugTakenError,
  TenantForbiddenError,
} from '../../domain/errors/companies.errors';
import { CreateLocalUseCase } from './create-local.use-case';

function build() {
  const companies = new InMemoryCompanyRepository();
  const locals = new InMemoryLocalRepository();
  const useCase = new CreateLocalUseCase(companies, locals);
  return { companies, locals, useCase };
}

function input(overrides: Partial<Parameters<CreateLocalUseCase['execute']>[0]> = {}) {
  return {
    companyId: 'company-1',
    name: 'Aurora Barranco',
    slug: 'aurora-barranco',
    isSuperAdmin: true,
    actorCompanyId: null,
    ...overrides,
  };
}

describe('CreateLocalUseCase', () => {
  it('super_admin crea un local en borrador y lo persiste', async () => {
    const { companies, locals, useCase } = build();
    await companies.create(new CompanyBuilder().withId('company-1').build());

    const local = await useCase.execute(input());

    expect(local.companyId).toBe('company-1');
    expect(local.slug).toBe('aurora-barranco');
    expect(local.status).toBe('draft');
    expect(locals.size).toBe(1);
  });

  it('admin_local crea un local en SU empresa', async () => {
    const { companies, locals, useCase } = build();
    await companies.create(new CompanyBuilder().withId('company-1').build());

    const local = await useCase.execute(
      input({ isSuperAdmin: false, actorCompanyId: 'company-1' }),
    );

    expect(local.companyId).toBe('company-1');
    expect(locals.size).toBe(1);
  });

  it('admin_local de otra empresa → TenantForbiddenError (scoping multi-tenant)', async () => {
    const { companies, locals, useCase } = build();
    await companies.create(new CompanyBuilder().withId('company-1').build());

    await expect(
      useCase.execute(input({ isSuperAdmin: false, actorCompanyId: 'other-company' })),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
    expect(locals.size).toBe(0);
  });

  it('empresa inexistente → CompanyNotFoundError', async () => {
    const { locals, useCase } = build();

    await expect(useCase.execute(input())).rejects.toBeInstanceOf(CompanyNotFoundError);
    expect(locals.size).toBe(0);
  });

  it('slug ya en uso → LocalSlugTakenError (unicidad de slug)', async () => {
    const { companies, locals, useCase } = build();
    await companies.create(new CompanyBuilder().withId('company-1').build());
    await locals.create(new LocalBuilder().withSlug('aurora-barranco').build());

    await expect(useCase.execute(input())).rejects.toBeInstanceOf(LocalSlugTakenError);
    expect(locals.size).toBe(1);
  });
});
