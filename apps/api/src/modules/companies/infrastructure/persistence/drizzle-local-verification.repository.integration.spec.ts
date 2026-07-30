import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  local as localTable,
  user as userTable,
} from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { LocalVerification } from '../../domain/entities/local-verification.entity';
import { DrizzleLocalVerificationRepository } from './drizzle-local-verification.repository';

let client: DbClient;
let repo: DrizzleLocalVerificationRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleLocalVerificationRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra empresa + local (FK obligatoria de local_verification.local_id). */
async function seedLocal(slug: string): Promise<string> {
  const companyId = randomUUID();
  await client.db.insert(companyTable).values({
    id: companyId,
    legalName: `Empresa ${slug}`,
    ruc: `2010000${Math.floor(Math.random() * 10000)}`.slice(0, 11).padEnd(11, '0'),
    commercialName: `Comercial ${slug}`,
    status: 'active',
  });
  const localId = randomUUID();
  await client.db.insert(localTable).values({
    id: localId,
    companyId,
    name: `Local ${slug}`,
    slug,
    status: 'active',
  });
  return localId;
}

describe('DrizzleLocalVerificationRepository (integration)', () => {
  it('round-trip: create + findById conserva el local y el estado inicial', async () => {
    const localId = await seedLocal('local-verif-1');
    const verification = LocalVerification.request({
      id: randomUUID(),
      localId,
      licenseReference: 'ITSE-2026-001',
      validUntil: '2027-12-31',
    });
    await repo.create(verification);

    const found = await repo.findById(verification.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(verification.id);
    expect(found?.localId).toBe(localId);
    expect(found?.status).toBe('pending');
    expect(found?.licenseReference).toBe('ITSE-2026-001');
    expect(found?.validUntil).toBe('2027-12-31');
  });

  it('findById inexistente → null', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('FK local_id: una verificación con local inexistente es rechazada por la BD', async () => {
    const orphan = LocalVerification.request({ id: randomUUID(), localId: randomUUID() });
    await expect(repo.create(orphan)).rejects.toThrow();
  });

  it('update persiste la revisión (status aprobado)', async () => {
    const localId = await seedLocal('local-verif-2');
    const reviewerId = randomUUID();
    await client.db.insert(userTable).values({
      id: reviewerId,
      fullName: 'Revisor de locales',
      email: `revisor-${reviewerId}@example.com`,
    });
    const verification = LocalVerification.request({ id: randomUUID(), localId });
    await repo.create(verification);
    verification.review('approved', reviewerId, 'Documentación correcta');
    await repo.update(verification);

    const found = await repo.findById(verification.id);
    expect(found?.status).toBe('approved');
  });

  it('multi-tenant: cada verificación queda ligada a su propio local', async () => {
    const localA = await seedLocal('local-verif-a');
    const localB = await seedLocal('local-verif-b');
    const verifA = LocalVerification.request({ id: randomUUID(), localId: localA });
    const verifB = LocalVerification.request({ id: randomUUID(), localId: localB });
    await repo.create(verifA);
    await repo.create(verifB);

    expect((await repo.findById(verifA.id))?.localId).toBe(localA);
    expect((await repo.findById(verifB.id))?.localId).toBe(localB);
  });
});
