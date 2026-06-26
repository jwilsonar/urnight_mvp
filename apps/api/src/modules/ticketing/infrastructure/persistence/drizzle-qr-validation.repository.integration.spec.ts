import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  event as eventTable,
  local as localTable,
  qrValidation as qrValidationTable,
  ticketType as ticketTypeTable,
  user as userTable,
} from '@urnight/db';
import { eq } from 'drizzle-orm';
import { AttendeeBuilder, OrderBuilder, TicketBuilder } from '../../../../shared/testing/builders/ticketing';
import type { QrValidationRecord } from '../../domain/ports/qr-validation.repository';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleOrderRepository } from './drizzle-order.repository';
import { DrizzleQrValidationRepository } from './drizzle-qr-validation.repository';
import { DrizzleTicketRepository } from './drizzle-ticket.repository';

let client: DbClient;
let repo: DrizzleQrValidationRepository;
let orders: DrizzleOrderRepository;
let tickets: DrizzleTicketRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleQrValidationRepository(client.db);
  orders = new DrizzleOrderRepository(client.db);
  tickets = new DrizzleTicketRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SeededTicket {
  ticketId: string;
  eventId: string;
  localId: string;
  userId: string;
}

/** Siembra la cadena de FK + un ticket emitido (necesario por las FK de qr_validation). */
async function seedTicket(): Promise<SeededTicket> {
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
  await orders.create(
    new OrderBuilder()
      .withUser(userId)
      .withEvent(eventId)
      .withOrderCode(`ORD-${randomUUID().slice(0, 8)}`)
      .withItems([{ id: orderItemId, ticketTypeId, quantity: 1, unitPrice: 50 }])
      .build(),
  );
  const ticket = new TicketBuilder()
    .withOrderItem(orderItemId)
    .withEvent(eventId)
    .withTicketType(ticketTypeId)
    .withQr(`QR-${randomUUID().slice(0, 8)}`)
    .build();
  const attendee = new AttendeeBuilder().withTicket(ticket.id).build();
  await tickets.issueMany([{ ticket, attendee }], undefined);
  return { ticketId: ticket.id, eventId, localId, userId };
}

function buildRecord(seed: SeededTicket, overrides: Partial<QrValidationRecord> = {}): QrValidationRecord {
  return {
    id: randomUUID(),
    ticketId: seed.ticketId,
    eventId: seed.eventId,
    localId: seed.localId,
    validatedBy: seed.userId,
    result: 'valid',
    method: 'scan',
    deviceInfo: 'Scanner-01',
    ...overrides,
  };
}

describe('DrizzleQrValidationRepository (integration)', () => {
  it('round-trip: create persiste el registro de validación', async () => {
    const seed = await seedTicket();
    const record = buildRecord(seed);
    await repo.create(record);

    const [row] = await client.db
      .select()
      .from(qrValidationTable)
      .where(eq(qrValidationTable.id, record.id))
      .limit(1);
    expect(row).toBeDefined();
    expect(row?.ticketId).toBe(seed.ticketId);
    expect(row?.eventId).toBe(seed.eventId);
    expect(row?.localId).toBe(seed.localId);
    expect(row?.validatedBy).toBe(seed.userId);
    expect(row?.result).toBe('valid');
    expect(row?.method).toBe('scan');
  });

  it('FK ticket_id: una validación con ticket_id inexistente es rechazada por la BD', async () => {
    const seed = await seedTicket();
    const record = buildRecord(seed, { ticketId: randomUUID() });
    await expect(repo.create(record)).rejects.toThrow();
  });

  it('CHECK result: un resultado fuera del catálogo es rechazado por la BD', async () => {
    const seed = await seedTicket();
    const record = buildRecord(seed, { result: 'bogus' as QrValidationRecord['result'] });
    await expect(repo.create(record)).rejects.toThrow();
  });
});
