import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DbClient } from '@urnight/db';
import { PromoCodeBuilder } from '../../../../shared/testing/builders/promoters';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzlePromoCodeRepository } from './drizzle-promo-code.repository';

let client: DbClient;
let repo: DrizzlePromoCodeRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzlePromoCodeRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

describe('DrizzlePromoCodeRepository (integration)', () => {
  it('round-trip: create + findByCode conserva tipo, valor y scope', async () => {
    const created = await repo.create(
      new PromoCodeBuilder()
        .withId(randomUUID())
        .withCode('WELCOME10')
        .asPercentage(10)
        .withScope('global')
        .build(),
    );
    expect(created.code).toBe('WELCOME10');

    const found = await repo.findByCode('WELCOME10');
    expect(found).not.toBeNull();
    expect(found?.discountType).toBe('percentage');
    expect(found?.discountValue).toBe(10);
    expect(found?.scope).toBe('global');
    expect(found?.isActive).toBe(true);
  });

  it('findByCode es case-insensitive (normaliza a mayúsculas)', async () => {
    await repo.create(new PromoCodeBuilder().withId(randomUUID()).withCode('SUMMER25').build());

    expect((await repo.findByCode('summer25'))?.code).toBe('SUMMER25');
  });

  it('findByCode inexistente → null', async () => {
    expect(await repo.findByCode('NOEXISTE')).toBeNull();
  });

  it('existsByCode detecta presencia y ausencia', async () => {
    await repo.create(new PromoCodeBuilder().withId(randomUUID()).withCode('EXISTS50').build());

    expect(await repo.existsByCode('EXISTS50')).toBe(true);
    expect(await repo.existsByCode('exists50')).toBe(true);
    expect(await repo.existsByCode('GHOST000')).toBe(false);
  });

  it('UNIQUE promo_code.code: dos códigos con el mismo code son rechazados por la BD', async () => {
    await repo.create(new PromoCodeBuilder().withId(randomUUID()).withCode('DUPCODE').build());
    await expect(
      repo.create(new PromoCodeBuilder().withId(randomUUID()).withCode('DUPCODE').build()),
    ).rejects.toThrow();
  });
});
