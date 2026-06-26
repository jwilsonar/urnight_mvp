import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, company, local } from '@urnight/db';
import { PromoterBuilder, ReferralLinkBuilder } from '../../../../shared/testing/builders/promoters';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzlePromoterRepository } from './drizzle-promoter.repository';

let client: DbClient;
let repo: DrizzlePromoterRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzlePromoterRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra company + local (FK promoter.company_id → company, local_id → local). */
async function seedCompanyAndLocal(): Promise<{ companyId: string; localId: string }> {
  const companyId: string = randomUUID();
  const localId: string = randomUUID();
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
  return { companyId, localId };
}

describe('DrizzlePromoterRepository (integration)', () => {
  it('round-trip: create persiste promotor + link y findById/getLink los recupera', async () => {
    const { companyId, localId } = await seedCompanyAndLocal();
    const promoterId: string = randomUUID();
    const promoter = new PromoterBuilder()
      .withId(promoterId)
      .withCompanyId(companyId)
      .withLocalId(localId)
      .withName('Promotor Integracion')
      .build();
    const link = new ReferralLinkBuilder().withPromoterId(promoterId).withCode('RTLINK01').build();
    await repo.create(promoter, link);

    const found = await repo.findById(promoterId);
    expect(found).not.toBeNull();
    expect(found?.companyId).toBe(companyId);
    expect(found?.localId).toBe(localId);
    expect(found?.name).toBe('Promotor Integracion');
    expect(found?.status).toBe('active');

    const foundLink = await repo.getLink(promoterId);
    expect(foundLink?.code).toBe('RTLINK01');
    expect(foundLink?.promoterId).toBe(promoterId);
  });

  it('findById inexistente → null', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('getLink de un promotor inexistente → null', async () => {
    expect(await repo.getLink(randomUUID())).toBeNull();
  });

  it('UNIQUE referral_link.code: dos links con el mismo code son rechazados por la BD', async () => {
    const { companyId } = await seedCompanyAndLocal();
    const promoterAId: string = randomUUID();
    const promoterBId: string = randomUUID();
    await repo.create(
      new PromoterBuilder().withId(promoterAId).withCompanyId(companyId).withLocalId(null).build(),
      new ReferralLinkBuilder().withPromoterId(promoterAId).withCode('DUPCODE1').build(),
    );
    await expect(
      repo.create(
        new PromoterBuilder().withId(promoterBId).withCompanyId(companyId).withLocalId(null).build(),
        new ReferralLinkBuilder().withPromoterId(promoterBId).withCode('DUPCODE1').build(),
      ),
    ).rejects.toThrow();
  });

  it('UNIQUE referral_link.promoter_id: un segundo link para el mismo promotor es rechazado', async () => {
    const { companyId } = await seedCompanyAndLocal();
    const promoterId: string = randomUUID();
    await repo.create(
      new PromoterBuilder().withId(promoterId).withCompanyId(companyId).withLocalId(null).build(),
      new ReferralLinkBuilder().withPromoterId(promoterId).withCode('FIRSTLNK').build(),
    );
    // Segundo create reusa el mismo promoterId en el link → viola idx_referral_link_promoter.
    await expect(
      repo.create(
        new PromoterBuilder().withId(randomUUID()).withCompanyId(companyId).withLocalId(null).build(),
        new ReferralLinkBuilder().withPromoterId(promoterId).withCode('SECONDLN').build(),
      ),
    ).rejects.toThrow();
  });
});
