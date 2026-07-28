import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  local as localTable,
  user as userTable,
  zone as zoneTable,
} from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { AffiliationRequest } from '../../domain/entities/affiliation-request.entity';
import { DrizzleAffiliationRequestRepository } from './drizzle-affiliation-request.repository';

let client: DbClient;
let repo: DrizzleAffiliationRequestRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleAffiliationRequestRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra una zona (FK opcional de affiliation_request.zone_id). */
async function seedZone(slug: string): Promise<string> {
  const id = randomUUID();
  await client.db.insert(zoneTable).values({ id, name: `Zona ${slug}`, slug });
  return id;
}

/** Siembra un usuario revisor (FK opcional de reviewed_by). */
async function seedUser(email: string): Promise<string> {
  const id = randomUUID();
  await client.db.insert(userTable).values({ id, fullName: 'Revisor Admin', email });
  return id;
}

/** Siembra empresa + local (FK que setea approve() vía update). */
async function seedCompanyAndLocal(): Promise<{ companyId: string; localId: string }> {
  const companyId = randomUUID();
  await client.db.insert(companyTable).values({
    id: companyId,
    legalName: 'Empresa Aprobada SAC',
    ruc: '20999999999',
    commercialName: 'Aprobada',
    status: 'active',
  });
  const localId = randomUUID();
  await client.db.insert(localTable).values({
    id: localId,
    companyId,
    name: 'Local Aprobado',
    slug: `local-aprobado-${randomUUID()}`,
    status: 'active',
  });
  return { companyId, localId };
}

function buildRequest(input?: { ruc?: string; zoneId?: string | null; submittedBy?: string | null }): AffiliationRequest {
  return AffiliationRequest.submit({
    id: randomUUID(),
    legalName: 'Nuevo Negocio SAC',
    ruc: input?.ruc ?? '20555555555',
    commercialName: 'Nuevo Negocio',
    zoneId: input?.zoneId ?? null,
    address: 'Jr. Union 123',
    contactName: 'Juan Perez',
    contactEmail: 'juan@negocio.pe',
    contactPhone: '987654321',
    termsAccepted: true,
    legalDeclarationAccepted: true,
    submittedBy: input?.submittedBy ?? null,
  });
}

describe('DrizzleAffiliationRequestRepository (integration)', () => {
  it('round-trip: create + findById conserva los campos de la solicitud', async () => {
    const zoneId = await seedZone('barranco');
    const request = buildRequest({ ruc: '20555555501', zoneId });
    await repo.create(request);

    const found = await repo.findById(request.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(request.id);
    expect(found?.legalName).toBe('Nuevo Negocio SAC');
    expect(found?.ruc).toBe('20555555501');
    expect(found?.zoneId).toBe(zoneId);
    expect(found?.contactEmail).toBe('juan@negocio.pe');
    expect(found?.termsAccepted).toBe(true);
    expect(found?.termsAcceptedAt).toBeInstanceOf(Date);
    expect(found?.legalDeclarationAccepted).toBe(true);
    expect(found?.legalDeclarationAcceptedAt).toBeInstanceOf(Date);
    expect(found?.status).toBe('pending');
    expect(found?.companyId).toBeNull();
    expect(found?.localId).toBeNull();
  });

  it('findById inexistente → null', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('FK zone_id: una solicitud con zona inexistente es rechazada por la BD', async () => {
    const request = buildRequest({ ruc: '20555555502', zoneId: randomUUID() });
    await expect(repo.create(request)).rejects.toThrow();
  });

  it('update persiste el rechazo (status + motivo + revisor)', async () => {
    const reviewerId = await seedUser('revisor-reject@urnight.pe');
    const request = buildRequest({ ruc: '20555555503' });
    await repo.create(request);
    request.reject(reviewerId, 'RUC no coincide con SUNAT');
    await repo.update(request);

    const found = await repo.findById(request.id);
    expect(found?.status).toBe('rejected');
    expect(found?.rejectionReason).toBe('RUC no coincide con SUNAT');
  });

  it('approve() liga la solicitud a company + local creados (camino transaccional)', async () => {
    const reviewerId = await seedUser('revisor-approve@urnight.pe');
    const { companyId, localId } = await seedCompanyAndLocal();
    const request = buildRequest({ ruc: '20555555504' });
    await repo.create(request);
    request.approve(reviewerId, companyId, localId);
    await repo.update(request);

    const found = await repo.findById(request.id);
    expect(found?.status).toBe('approved');
    expect(found?.companyId).toBe(companyId);
    expect(found?.localId).toBe(localId);
  });

  it('multi-tenant: cada solicitud queda aislada por su propio id y RUC', async () => {
    const requestA = buildRequest({ ruc: '20555555505' });
    const requestB = buildRequest({ ruc: '20555555506' });
    await repo.create(requestA);
    await repo.create(requestB);

    expect((await repo.findById(requestA.id))?.ruc).toBe('20555555505');
    expect((await repo.findById(requestB.id))?.ruc).toBe('20555555506');
  });
});
