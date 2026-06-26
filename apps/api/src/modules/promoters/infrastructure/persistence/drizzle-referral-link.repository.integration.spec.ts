import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, company, promoter, referralLink } from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleReferralLinkRepository } from './drizzle-referral-link.repository';

let client: DbClient;
let repo: DrizzleReferralLinkRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleReferralLinkRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

let rucSeq = 20100000000;

/** Siembra company + promoter + referral_link (FK referral_link.promoter_id → promoter). */
async function seedLink(code: string, clicks = 0): Promise<{ promoterId: string }> {
  const companyId: string = randomUUID();
  const promoterId: string = randomUUID();
  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Compania Demo SAC',
    ruc: String(rucSeq++),
    commercialName: 'Demo',
  });
  await client.db.insert(promoter).values({
    id: promoterId,
    companyId,
    name: 'Promotor Demo',
  });
  await client.db.insert(referralLink).values({
    id: randomUUID(),
    promoterId,
    code,
    url: `https://urnight.pe/r/${code}`,
    clicks,
  });
  return { promoterId };
}

describe('DrizzleReferralLinkRepository (integration)', () => {
  it('round-trip: findByCode recupera el link sembrado con sus campos', async () => {
    const { promoterId } = await seedLink('FINDME01', 3);

    const found = await repo.findByCode('FINDME01');
    expect(found).not.toBeNull();
    expect(found?.promoterId).toBe(promoterId);
    expect(found?.code).toBe('FINDME01');
    expect(found?.clicks).toBe(3);
    expect(found?.isActive).toBe(true);
  });

  it('findByCode inexistente → null', async () => {
    expect(await repo.findByCode('NOPE0000')).toBeNull();
  });

  it('existsByCode detecta presencia y ausencia', async () => {
    await seedLink('EXISTS01');

    expect(await repo.existsByCode('EXISTS01')).toBe(true);
    expect(await repo.existsByCode('GHOST000')).toBe(false);
  });

  it('registerClick incrementa el contador de clicks de forma persistente', async () => {
    await seedLink('CLICKS01', 1);

    await repo.registerClick('CLICKS01');
    await repo.registerClick('CLICKS01');

    expect((await repo.findByCode('CLICKS01'))?.clicks).toBe(3);
  });

  it('UNIQUE referral_link.code: insertar dos veces el mismo code es rechazado por la BD', async () => {
    await seedLink('DUPREF01');
    await expect(seedLink('DUPREF01')).rejects.toThrow();
  });
});
