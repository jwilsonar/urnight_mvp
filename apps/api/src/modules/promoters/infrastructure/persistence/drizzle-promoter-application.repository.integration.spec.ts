import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, company, local, promoter, user } from '@urnight/db';
import { PromoterApplicationBuilder } from '../../../../shared/testing/builders/promoters';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzlePromoterApplicationRepository } from './drizzle-promoter-application.repository';

let client: DbClient;
let repo: DrizzlePromoterApplicationRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzlePromoterApplicationRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra local + user (FK promoter_application.local_id → local, applicant_user_id → user). */
async function seedLocalAndUser(): Promise<{ localId: string; userId: string }> {
  const companyId: string = randomUUID();
  const localId: string = randomUUID();
  const userId: string = randomUUID();
  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Compania Demo SAC',
    ruc: '20100000001',
    commercialName: 'Demo',
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: 'Local Demo',
    slug: `local-demo-${localId}`,
  });
  await client.db.insert(user).values({
    id: userId,
    fullName: 'Aspirante Demo',
    email: `aspirante-${userId}@example.com`,
  });
  return { localId, userId };
}

/** Siembra company + promoter (FK promoter_application.created_promoter_id → promoter). */
async function seedPromoter(): Promise<string> {
  const companyId: string = randomUUID();
  const promoterId: string = randomUUID();
  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Compania Promotor SAC',
    ruc: '20100000002',
    commercialName: 'PromoCo',
  });
  await client.db.insert(promoter).values({
    id: promoterId,
    companyId,
    name: 'Promotor Creado',
  });
  return promoterId;
}

describe('DrizzlePromoterApplicationRepository (integration)', () => {
  it('round-trip: create + findById conserva los campos de la postulación', async () => {
    const { localId, userId } = await seedLocalAndUser();
    const appId: string = randomUUID();
    const created = await repo.create(
      new PromoterApplicationBuilder()
        .withId(appId)
        .withLocalId(localId)
        .withApplicantUserId(userId)
        .withName('Aspirante Integracion')
        .withContactEmail('aspira@example.com')
        .build(),
    );
    expect(created.id).toBe(appId);
    expect(created.status).toBe('pending');

    const found = await repo.findById(appId);
    expect(found).not.toBeNull();
    expect(found?.localId).toBe(localId);
    expect(found?.applicantUserId).toBe(userId);
    expect(found?.name).toBe('Aspirante Integracion');
    expect(found?.contactEmail).toBe('aspira@example.com');
    expect(found?.isPending()).toBe(true);
  });

  it('findById inexistente → null', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('update persiste la aprobación (status + created_promoter_id + reviewed_at)', async () => {
    const { localId, userId } = await seedLocalAndUser();
    const promoterId: string = await seedPromoter();
    const appId: string = randomUUID();
    const app = await repo.create(
      new PromoterApplicationBuilder()
        .withId(appId)
        .withLocalId(localId)
        .withApplicantUserId(userId)
        .build(),
    );
    app.approve(userId, promoterId);
    await repo.update(app);

    const found = await repo.findById(appId);
    expect(found?.status).toBe('approved');
    expect(found?.createdPromoterId).toBe(promoterId);
  });

  it('update persiste el rechazo (status = rejected)', async () => {
    const { localId, userId } = await seedLocalAndUser();
    const appId: string = randomUUID();
    const app = await repo.create(
      new PromoterApplicationBuilder().withId(appId).withLocalId(localId).withApplicantUserId(userId).build(),
    );
    app.reject(userId);
    await repo.update(app);

    expect((await repo.findById(appId))?.status).toBe('rejected');
  });
});
