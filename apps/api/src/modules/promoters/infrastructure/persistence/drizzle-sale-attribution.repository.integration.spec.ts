import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company,
  event,
  local,
  order,
  promoter,
  referralLink,
  user,
} from '@urnight/db';
import { SaleAttributionBuilder } from '../../../../shared/testing/builders/promoters';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleSaleAttributionRepository } from './drizzle-sale-attribution.repository';

let client: DbClient;
let repo: DrizzleSaleAttributionRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleSaleAttributionRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SaleParents {
  promoterId: string;
  referralLinkId: string;
}

let orderSeq = 0;

/**
 * Siembra la cadena de FK de sale_attribution:
 * company → local → event → user → order, y company → promoter → referral_link.
 */
async function seedParents(): Promise<SaleParents & { orderId: string }> {
  const companyId: string = randomUUID();
  const localId: string = randomUUID();
  const eventId: string = randomUUID();
  const userId: string = randomUUID();
  const orderId: string = randomUUID();
  const promoterId: string = randomUUID();
  const referralLinkId: string = randomUUID();

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
  await client.db.insert(event).values({
    id: eventId,
    localId,
    name: 'Evento Demo',
    slug: `evento-demo-${eventId}`,
    startsAt: new Date('2026-02-01T22:00:00Z'),
  });
  await client.db.insert(user).values({
    id: userId,
    fullName: 'Comprador Demo',
    email: `comprador-${userId}@example.com`,
  });
  await client.db.insert(order).values({
    id: orderId,
    orderCode: `ORD-${(orderSeq++).toString().padStart(8, '0')}`,
    userId,
    eventId,
    subtotal: '100.00',
    total: '100.00',
  });
  await client.db.insert(promoter).values({
    id: promoterId,
    companyId,
    name: 'Promotor Demo',
  });
  await client.db.insert(referralLink).values({
    id: referralLinkId,
    promoterId,
    code: `SA${(orderSeq).toString().padStart(6, '0')}`,
    url: `https://urnight.pe/r/sa-${referralLinkId}`,
  });
  return { promoterId, referralLinkId, orderId };
}

describe('DrizzleSaleAttributionRepository (integration)', () => {
  it('round-trip: create persiste la atribución y listByPromoter la recupera', async () => {
    const { promoterId, referralLinkId, orderId } = await seedParents();
    await repo.create(
      new SaleAttributionBuilder()
        .withId(randomUUID())
        .withOrderId(orderId)
        .withPromoterId(promoterId)
        .withReferralLinkId(referralLinkId)
        .withCommissionRate(0.05)
        .withCommissionAmount(5)
        .build(),
    );

    const list = await repo.listByPromoter(promoterId);
    expect(list).toHaveLength(1);
    expect(list[0]?.orderId).toBe(orderId);
    expect(list[0]?.referralLinkId).toBe(referralLinkId);
    expect(list[0]?.commissionRate).toBe(0.05);
    expect(list[0]?.commissionAmount).toBe(5);
    expect(list[0]?.status).toBe('estimated');
  });

  it('existsForOrder detecta presencia y ausencia por order_id', async () => {
    const { promoterId, referralLinkId, orderId } = await seedParents();
    await repo.create(
      new SaleAttributionBuilder()
        .withId(randomUUID())
        .withOrderId(orderId)
        .withPromoterId(promoterId)
        .withReferralLinkId(referralLinkId)
        .build(),
    );

    expect(await repo.existsForOrder(orderId)).toBe(true);
    expect(await repo.existsForOrder(randomUUID())).toBe(false);
  });

  it('listByPromoter de un promotor sin ventas → arreglo vacío', async () => {
    expect(await repo.listByPromoter(randomUUID())).toHaveLength(0);
  });

  it('UNIQUE sale_attribution.order_id: una segunda atribución para el mismo order es rechazada', async () => {
    const { promoterId, referralLinkId, orderId } = await seedParents();
    await repo.create(
      new SaleAttributionBuilder()
        .withId(randomUUID())
        .withOrderId(orderId)
        .withPromoterId(promoterId)
        .withReferralLinkId(referralLinkId)
        .build(),
    );
    await expect(
      repo.create(
        new SaleAttributionBuilder()
          .withId(randomUUID())
          .withOrderId(orderId)
          .withPromoterId(promoterId)
          .withReferralLinkId(referralLinkId)
          .build(),
      ),
    ).rejects.toThrow();
  });
});
