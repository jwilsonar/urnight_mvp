import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DbClient } from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { Company } from '../../domain/entities/company.entity';
import { DrizzleCompanyRepository } from './drizzle-company.repository';

let client: DbClient;
let repo: DrizzleCompanyRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleCompanyRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

function buildCompany(overrides?: { ruc?: string; legalName?: string }): Company {
  return Company.create({
    id: randomUUID(),
    legalName: overrides?.legalName ?? 'Discoteca SAC',
    ruc: overrides?.ruc ?? '20123456789',
    commercialName: 'NightClub',
    contactEmail: 'contacto@nightclub.pe',
    contactPhone: '999888777',
  });
}

describe('DrizzleCompanyRepository (integration)', () => {
  it('round-trip: create + findById conserva identidad y campos', async () => {
    const company = buildCompany();
    await repo.create(company);

    const found = await repo.findById(company.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(company.id);
    expect(found?.legalName).toBe('Discoteca SAC');
    expect(found?.ruc).toBe('20123456789');
    expect(found?.commercialName).toBe('NightClub');
    expect(found?.contactEmail).toBe('contacto@nightclub.pe');
    expect(found?.status).toBe('active');
  });

  it('findByRuc localiza la empresa y devuelve null si no existe', async () => {
    const company = buildCompany({ ruc: '20987654321' });
    await repo.create(company);

    expect((await repo.findByRuc('20987654321'))?.id).toBe(company.id);
    expect(await repo.findByRuc('20000000000')).toBeNull();
  });

  it('UNIQUE ruc: el segundo insert con el mismo RUC es rechazado por la BD', async () => {
    await repo.create(buildCompany({ ruc: '20111111111' }));
    const duplicate = buildCompany({ ruc: '20111111111', legalName: 'Otra Empresa SAC' });
    await expect(repo.create(duplicate)).rejects.toThrow();
  });

  it('update persiste mutaciones del aggregate (status)', async () => {
    const company = buildCompany();
    await repo.create(company);
    company.suspend();
    await repo.update(company);

    const found = await repo.findById(company.id);
    expect(found?.status).toBe('suspended');
  });

  it('multi-tenant: cada empresa se aísla por id (la empresa A no aparece al consultar B)', async () => {
    const companyA = buildCompany({ ruc: '20222222222', legalName: 'Empresa A SAC' });
    const companyB = buildCompany({ ruc: '20333333333', legalName: 'Empresa B SAC' });
    await repo.create(companyA);
    await repo.create(companyB);

    expect((await repo.findById(companyA.id))?.legalName).toBe('Empresa A SAC');
    expect((await repo.findById(companyB.id))?.legalName).toBe('Empresa B SAC');
    expect((await repo.findByRuc('20222222222'))?.id).toBe(companyA.id);
    expect((await repo.findByRuc('20333333333'))?.id).toBe(companyB.id);
  });
});
