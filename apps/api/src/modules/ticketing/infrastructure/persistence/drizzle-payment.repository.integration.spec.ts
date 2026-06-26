import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  event as eventTable,
  local as localTable,
  payment as paymentTable,
  ticketType as ticketTypeTable,
  user as userTable,
} from '@urnight/db';
import { eq } from 'drizzle-orm';
import { OrderBuilder, PaymentBuilder } from '../../../../shared/testing/builders/ticketing';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleOrderRepository } from './drizzle-order.repository';
import { DrizzlePaymentRepository } from './drizzle-payment.repository';

let client: DbClient;
let repo: DrizzlePaymentRepository;
let orders: DrizzleOrderRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzlePaymentRepository(client.db);
  orders = new DrizzleOrderRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra la cadena de FK (user→company→local→event→ticket_type) y devuelve un order persistido. */
async function seedOrder(): Promise<string> {
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
  const order = new OrderBuilder()
    .withUser(userId)
    .withEvent(eventId)
    .withOrderCode(`ORD-${randomUUID().slice(0, 8)}`)
    .withItems([{ id: randomUUID(), ticketTypeId, quantity: 1, unitPrice: 50 }])
    .build();
  await orders.create(order);
  return order.id;
}

describe('DrizzlePaymentRepository (integration)', () => {
  it('round-trip: create persiste el pago y se puede leer por la BD', async () => {
    const orderId = await seedOrder();
    const pay = new PaymentBuilder().withOrder(orderId).withMethod('card').withAmount(100).build();
    pay.approve('GW-REF-001');
    await repo.create(pay);

    const [row] = await client.db.select().from(paymentTable).where(eq(paymentTable.id, pay.id)).limit(1);
    expect(row).toBeDefined();
    expect(row?.orderId).toBe(orderId);
    expect(row?.method).toBe('card');
    expect(row?.gatewayReference).toBe('GW-REF-001');
    expect(row?.amount).toBe('100.00');
    expect(row?.status).toBe('approved');
    expect(row?.confirmedAt).not.toBeNull();
  });

  it('FK order_id: un pago con order_id inexistente es rechazado por la BD', async () => {
    const pay = new PaymentBuilder().withOrder(randomUUID()).withMethod('yape').withAmount(50).build();
    await expect(repo.create(pay)).rejects.toThrow();
  });

  it('CHECK payment_method: un método fuera del catálogo es rechazado por la BD', async () => {
    const orderId = await seedOrder();
    await expect(
      client.db.insert(paymentTable).values({
        id: randomUUID(),
        orderId,
        method: 'bitcoin',
        amount: '10.00',
      }),
    ).rejects.toThrow();
  });
});
