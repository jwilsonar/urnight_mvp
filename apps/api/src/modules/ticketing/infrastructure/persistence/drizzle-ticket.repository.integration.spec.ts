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
import { AttendeeBuilder, OrderBuilder, TicketBuilder } from '../../../../shared/testing/builders/ticketing';
import type { IssuedTicket } from '../../domain/ports/ticket.repository';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleOrderRepository } from './drizzle-order.repository';
import { DrizzleTicketRepository } from './drizzle-ticket.repository';

let client: DbClient;
let repo: DrizzleTicketRepository;
let orders: DrizzleOrderRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleTicketRepository(client.db);
  orders = new DrizzleOrderRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SeededOrder {
  userId: string;
  eventId: string;
  ticketTypeId: string;
  orderItemId: string;
}

/** Siembra la cadena de FK y un order con un order_item; devuelve los ids para emitir tickets. */
async function seedOrder(): Promise<SeededOrder> {
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
  const orderItemId = randomUUID();
  const order = new OrderBuilder()
    .withUser(userId)
    .withEvent(eventId)
    .withOrderCode(`ORD-${randomUUID().slice(0, 8)}`)
    .withItems([{ id: orderItemId, ticketTypeId, quantity: 1, unitPrice: 50 }])
    .build();
  await orders.create(order);
  return { userId, eventId, ticketTypeId, orderItemId };
}

/** Construye un par ticket + attendee listo para issueMany. */
function buildIssued(seed: SeededOrder, qrCode: string): IssuedTicket {
  const ticket = new TicketBuilder()
    .withOrderItem(seed.orderItemId)
    .withEvent(seed.eventId)
    .withTicketType(seed.ticketTypeId)
    .withQr(qrCode)
    .build();
  const attendee = new AttendeeBuilder().withTicket(ticket.id).withFullName('Grace Hopper').build();
  return { ticket, attendee };
}

describe('DrizzleTicketRepository (integration)', () => {
  it('round-trip: issueMany + findByQr conserva el ticket emitido', async () => {
    const seed = await seedOrder();
    const issued = buildIssued(seed, 'QR-ROUNDTRIP');
    await repo.issueMany([issued], undefined);

    const found = await repo.findByQr('QR-ROUNDTRIP');
    expect(found).not.toBeNull();
    expect(found?.id).toBe(issued.ticket.id);
    expect(found?.orderItemId).toBe(seed.orderItemId);
    expect(found?.eventId).toBe(seed.eventId);
    expect(found?.qrCode).toBe('QR-ROUNDTRIP');
    expect(found?.status).toBe('valid');
  });

  it('UNIQUE qr_code: emitir dos tickets con el mismo qr_code es rechazado por la BD', async () => {
    const seed = await seedOrder();
    await repo.issueMany([buildIssued(seed, 'QR-DUP')], undefined);
    await expect(repo.issueMany([buildIssued(seed, 'QR-DUP')], undefined)).rejects.toThrow();
  });

  it('listByUser devuelve solo los tickets del usuario con el nombre del asistente', async () => {
    const a = await seedOrder();
    const b = await seedOrder();
    await repo.issueMany([buildIssued(a, 'QR-USER-A')], undefined);
    await repo.issueMany([buildIssued(b, 'QR-USER-B')], undefined);

    const list = await repo.listByUser(a.userId);
    expect(list).toHaveLength(1);
    expect(list[0]?.ticket.qrCode).toBe('QR-USER-A');
    expect(list[0]?.attendeeName).toBe('Grace Hopper');
  });

  it('update persiste mutaciones del aggregate (markUsed → used + usedAt)', async () => {
    const seed = await seedOrder();
    const issued = buildIssued(seed, 'QR-USED');
    await repo.issueMany([issued], undefined);
    issued.ticket.markUsed(new Date());
    await repo.update(issued.ticket);

    const found = await repo.findByQr('QR-USED');
    expect(found?.status).toBe('used');
  });
});
