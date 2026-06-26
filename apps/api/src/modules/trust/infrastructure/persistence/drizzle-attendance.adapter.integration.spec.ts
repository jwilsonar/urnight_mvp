import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  company,
  type DbClient,
  event,
  local,
  order,
  orderItem,
  ticket,
  ticketType,
  user,
} from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleAttendanceAdapter } from './drizzle-attendance.adapter';

let client: DbClient;
let adapter: DrizzleAttendanceAdapter;

beforeAll(() => {
  client = createTestDb();
  adapter = new DrizzleAttendanceAdapter(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SeedIds {
  userId: string;
  localId: string;
  eventId: string;
  ticketId: string;
}

/**
 * Siembra la cadena del JOIN ACL: user → company → local → event → ticketType →
 * order → orderItem → ticket. `ticketStatus` controla el filtro de elegibilidad.
 */
async function seedChain(ticketStatus: string = 'used'): Promise<SeedIds> {
  const userId = randomUUID();
  const companyId = randomUUID();
  const localId = randomUUID();
  const eventId = randomUUID();
  const ticketTypeId = randomUUID();
  const orderId = randomUUID();
  const orderItemId = randomUUID();
  const ticketId = randomUUID();

  await client.db.insert(user).values({
    id: userId,
    fullName: 'Asistente',
    email: `user-${userId}@example.com`,
  });
  await client.db.insert(company).values({
    id: companyId,
    legalName: 'Empresa SAC',
    ruc: `${Date.now()}`.slice(0, 11).padEnd(11, '0'),
    commercialName: 'Empresa',
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: 'Local Centro',
    slug: `local-${localId}`,
  });
  await client.db.insert(event).values({
    id: eventId,
    localId,
    name: 'Fiesta',
    slug: `event-${eventId}`,
    startsAt: new Date(),
  });
  await client.db.insert(ticketType).values({
    id: ticketTypeId,
    eventId,
    name: 'General',
    price: '50.00',
    stock: 100,
  });
  await client.db.insert(order).values({
    id: orderId,
    orderCode: `ORD-${orderId}`.slice(0, 20),
    userId,
    eventId,
    subtotal: '50.00',
    total: '50.00',
  });
  await client.db.insert(orderItem).values({
    id: orderItemId,
    orderId,
    ticketTypeId,
    quantity: 1,
    unitPrice: '50.00',
    lineTotal: '50.00',
  });
  await client.db.insert(ticket).values({
    id: ticketId,
    orderItemId,
    eventId,
    ticketTypeId,
    qrCode: `QR-${ticketId}`.slice(0, 64),
    status: ticketStatus,
  });

  return { userId, localId, eventId, ticketId };
}

describe('DrizzleAttendanceAdapter (integration)', () => {
  it('round-trip: devuelve event/local cuando el ticket está USED y pertenece al usuario', async () => {
    const seed = await seedChain('used');

    const ctx = await adapter.getUsedTicketContext(seed.userId, seed.ticketId);
    expect(ctx).not.toBeNull();
    expect(ctx?.eventId).toBe(seed.eventId);
    expect(ctx?.localId).toBe(seed.localId);
  });

  it('devuelve null si el ticket no está USED (p. ej. valid)', async () => {
    const seed = await seedChain('valid');
    expect(await adapter.getUsedTicketContext(seed.userId, seed.ticketId)).toBeNull();
  });

  it('devuelve null si el ticket pertenece a otro usuario', async () => {
    const seed = await seedChain('used');
    const otherUserId = randomUUID();
    await client.db.insert(user).values({
      id: otherUserId,
      fullName: 'Intruso',
      email: `other-${otherUserId}@example.com`,
    });

    expect(await adapter.getUsedTicketContext(otherUserId, seed.ticketId)).toBeNull();
  });

  it('devuelve null si el ticket no existe', async () => {
    const seed = await seedChain('used');
    expect(await adapter.getUsedTicketContext(seed.userId, randomUUID())).toBeNull();
  });
});
