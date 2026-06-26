import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  event as eventTable,
  local as localTable,
  ticketType as ticketTypeTable,
  user as userTable,
} from '@urnight/db';
import { OrderBuilder } from '../../../../shared/testing/builders/ticketing';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleOrderRepository } from './drizzle-order.repository';

let client: DbClient;
let repo: DrizzleOrderRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleOrderRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SeedChain {
  userId: string;
  eventId: string;
  ticketTypeId: string;
}

/** Siembra la cadena de FK obligatoria de order: user, company→local→event→ticket_type. */
async function seedChain(): Promise<SeedChain> {
  const userId = randomUUID();
  await client.db.insert(userTable).values({
    id: userId,
    fullName: 'Ada Lovelace',
    email: `ada-${userId}@example.com`,
    documentNumber: userId.slice(0, 12),
  });

  const companyId = randomUUID();
  await client.db.insert(companyTable).values({
    id: companyId,
    legalName: 'Empresa Test',
    ruc: userId.replace(/\D/g, '').slice(0, 11).padEnd(11, '0'),
    commercialName: 'Comercial Test',
    status: 'active',
  });

  const localId = randomUUID();
  await client.db.insert(localTable).values({
    id: localId,
    companyId,
    name: 'Local Centro',
    slug: `local-${localId}`,
    status: 'active',
  });

  const eventId = randomUUID();
  await client.db.insert(eventTable).values({
    id: eventId,
    localId,
    name: 'Fiesta Test',
    slug: `evento-${eventId}`,
    startsAt: new Date(),
    status: 'published',
  });

  const ticketTypeId = randomUUID();
  await client.db.insert(ticketTypeTable).values({
    id: ticketTypeId,
    eventId,
    name: 'General',
    price: '50.00',
    stock: 100,
  });

  return { userId, eventId, ticketTypeId };
}

describe('DrizzleOrderRepository (integration)', () => {
  it('round-trip: create + findById conserva orden, items y totales', async () => {
    const { userId, eventId, ticketTypeId } = await seedChain();
    const order = new OrderBuilder()
      .withUser(userId)
      .withEvent(eventId)
      .withOrderCode('ORD-0001')
      .withItems([{ id: randomUUID(), ticketTypeId, quantity: 2, unitPrice: 50 }])
      .build();
    await repo.create(order);

    const found = await repo.findById(order.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(order.id);
    expect(found?.orderCode).toBe('ORD-0001');
    expect(found?.userId).toBe(userId);
    expect(found?.eventId).toBe(eventId);
    expect(found?.subtotal).toBe(100);
    expect(found?.total).toBe(100);
    expect(found?.status).toBe('pending');
    expect(found?.items).toHaveLength(1);
    expect(found?.items[0]?.ticketTypeId).toBe(ticketTypeId);
    expect(found?.items[0]?.quantity).toBe(2);
  });

  it('UNIQUE order_code: el segundo insert con el mismo order_code es rechazado por la BD', async () => {
    const { userId, eventId, ticketTypeId } = await seedChain();
    const items = [{ id: randomUUID(), ticketTypeId, quantity: 1, unitPrice: 50 }];
    await repo.create(
      new OrderBuilder().withUser(userId).withEvent(eventId).withOrderCode('ORD-DUP').withItems(items).build(),
    );
    const other = new OrderBuilder()
      .withUser(userId)
      .withEvent(eventId)
      .withOrderCode('ORD-DUP')
      .withItems([{ id: randomUUID(), ticketTypeId, quantity: 1, unitPrice: 50 }])
      .build();
    await expect(repo.create(other)).rejects.toThrow();
  });

  it('findByUser devuelve solo las órdenes del usuario con sus items', async () => {
    const a = await seedChain();
    const b = await seedChain();
    await repo.create(
      new OrderBuilder()
        .withUser(a.userId)
        .withEvent(a.eventId)
        .withOrderCode('ORD-A1')
        .withItems([{ id: randomUUID(), ticketTypeId: a.ticketTypeId, quantity: 1, unitPrice: 50 }])
        .build(),
    );
    await repo.create(
      new OrderBuilder()
        .withUser(b.userId)
        .withEvent(b.eventId)
        .withOrderCode('ORD-B1')
        .withItems([{ id: randomUUID(), ticketTypeId: b.ticketTypeId, quantity: 1, unitPrice: 50 }])
        .build(),
    );

    const list = await repo.findByUser(a.userId);
    expect(list).toHaveLength(1);
    expect(list[0]?.userId).toBe(a.userId);
    expect(list[0]?.items).toHaveLength(1);
    expect(list[0]?.items[0]?.ticketTypeId).toBe(a.ticketTypeId);
  });

  it('update persiste mutaciones del aggregate (confirmPayment → paid + paidAt)', async () => {
    const { userId, eventId, ticketTypeId } = await seedChain();
    const order = new OrderBuilder()
      .withUser(userId)
      .withEvent(eventId)
      .withOrderCode('ORD-PAY')
      .withItems([{ id: randomUUID(), ticketTypeId, quantity: 1, unitPrice: 50 }])
      .build();
    await repo.create(order);
    order.confirmPayment(new Date());
    await repo.update(order);

    const found = await repo.findById(order.id);
    expect(found?.status).toBe('paid');
    expect(found?.paidAt).not.toBeNull();
  });
});
