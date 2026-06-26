import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, company as companyTable, zone as zoneTable } from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { Local } from '../../domain/entities/local.entity';
import { DrizzleLocalRepository } from './drizzle-local.repository';

let client: DbClient;
let repo: DrizzleLocalRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleLocalRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra una empresa (FK obligatoria de local.company_id). */
async function seedCompany(ruc: string): Promise<string> {
  const id = randomUUID();
  await client.db.insert(companyTable).values({
    id,
    legalName: `Empresa ${ruc}`,
    ruc,
    commercialName: `Comercial ${ruc}`,
    status: 'active',
  });
  return id;
}

/** Siembra una zona (FK opcional de local.zone_id). */
async function seedZone(slug: string): Promise<string> {
  const id = randomUUID();
  await client.db.insert(zoneTable).values({ id, name: `Zona ${slug}`, slug });
  return id;
}

function buildLocal(input: {
  companyId: string;
  zoneId?: string | null;
  slug?: string;
  name?: string;
}): Local {
  return Local.create({
    id: randomUUID(),
    companyId: input.companyId,
    zoneId: input.zoneId ?? null,
    name: input.name ?? 'Local Centro',
    slug: input.slug ?? `local-${randomUUID()}`,
    description: 'Un local de prueba',
    address: 'Av. Siempre Viva 742',
    latitude: -12.04,
    longitude: -77.04,
  });
}

describe('DrizzleLocalRepository (integration)', () => {
  it('round-trip: create + findById conserva identidad, tenant y campos', async () => {
    const companyId = await seedCompany('20100000001');
    const zoneId = await seedZone('miraflores');
    const local = buildLocal({ companyId, zoneId, slug: 'club-miraflores', name: 'Club Miraflores' });
    await repo.create(local);

    const found = await repo.findById(local.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(local.id);
    expect(found?.companyId).toBe(companyId);
    expect(found?.zoneId).toBe(zoneId);
    expect(found?.name).toBe('Club Miraflores');
    expect(found?.slug).toBe('club-miraflores');
    expect(found?.status).toBe('draft');
    expect(found?.isVerified).toBe(false);
  });

  it('findBySlug / existsBySlug localizan por slug', async () => {
    const companyId = await seedCompany('20100000002');
    const local = buildLocal({ companyId, slug: 'unico-slug' });
    await repo.create(local);

    expect((await repo.findBySlug('unico-slug'))?.id).toBe(local.id);
    expect(await repo.existsBySlug('unico-slug')).toBe(true);
    expect(await repo.existsBySlug('no-existe')).toBe(false);
    expect(await repo.findBySlug('no-existe')).toBeNull();
  });

  it('UNIQUE slug: dos locales con el mismo slug son rechazados por la BD', async () => {
    const companyId = await seedCompany('20100000003');
    await repo.create(buildLocal({ companyId, slug: 'slug-repetido' }));
    await expect(
      repo.create(buildLocal({ companyId, slug: 'slug-repetido' })),
    ).rejects.toThrow();
  });

  it('update persiste mutaciones del aggregate (publish + setVerified)', async () => {
    const companyId = await seedCompany('20100000004');
    const local = buildLocal({ companyId, slug: 'local-mutable' });
    await repo.create(local);
    local.publish();
    local.setVerified(true);
    await repo.update(local);

    const found = await repo.findById(local.id);
    expect(found?.status).toBe('active');
    expect(found?.isVerified).toBe(true);
  });

  it('listVisible solo devuelve locales activos (filtro de visibilidad)', async () => {
    const companyId = await seedCompany('20100000005');
    const draft = buildLocal({ companyId, slug: 'borrador' });
    const active = buildLocal({ companyId, slug: 'publicado' });
    active.publish();
    await repo.create(draft);
    await repo.create(active);

    const visible = await repo.listVisible();
    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe(active.id);
  });

  it('listVisible filtra por zona (visibilidad scoped por zona)', async () => {
    const companyId = await seedCompany('20100000006');
    const zoneA = await seedZone('zona-a');
    const zoneB = await seedZone('zona-b');
    const inZoneA = buildLocal({ companyId, zoneId: zoneA, slug: 'en-zona-a' });
    const inZoneB = buildLocal({ companyId, zoneId: zoneB, slug: 'en-zona-b' });
    inZoneA.publish();
    inZoneB.publish();
    await repo.create(inZoneA);
    await repo.create(inZoneB);

    const onlyA = await repo.listVisible({ zoneId: zoneA });
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0]?.id).toBe(inZoneA.id);
  });

  it('multi-tenant: los locales se aíslan por company_id (los de la empresa A no se mezclan con la B)', async () => {
    const companyA = await seedCompany('20100000007');
    const companyB = await seedCompany('20100000008');
    const localA = buildLocal({ companyId: companyA, slug: 'local-empresa-a', name: 'Local A' });
    const localB = buildLocal({ companyId: companyB, slug: 'local-empresa-b', name: 'Local B' });
    await repo.create(localA);
    await repo.create(localB);

    const foundA = await repo.findById(localA.id);
    const foundB = await repo.findById(localB.id);
    expect(foundA?.companyId).toBe(companyA);
    expect(foundB?.companyId).toBe(companyB);
    // El slug de la empresa A no resuelve al local de la empresa B.
    expect((await repo.findBySlug('local-empresa-a'))?.companyId).toBe(companyA);
    expect((await repo.findBySlug('local-empresa-b'))?.companyId).toBe(companyB);
  });
});
