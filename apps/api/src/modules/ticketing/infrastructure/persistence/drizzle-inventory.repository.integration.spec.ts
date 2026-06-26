import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  event as eventTable,
  local as localTable,
  ticketType as ticketTypeTable,
} from '@urnight/db';
import { eq } from 'drizzle-orm';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleInventoryRepository } from './drizzle-inventory.repository';

let client: DbClient;
let repo: DrizzleInventoryRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleInventoryRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SeedInventory {
  eventId: string;
  ticketTypeId: string;
}

/** Siembra company→local→event→ticket_type con stock/sold configurables. */
async function seedInventory(opts: {
  stock?: number;
  sold?: number;
  eventStatus?: string;
} = {}): Promise<SeedInventory> {
  const companyId = randomUUID();
  await client.db.insert(companyTable).values({
    id: companyId,
    legalName: 'Empresa Test',
    ruc: randomUUID().replace(/\D/g, '').slice(0, 11).padEnd(11, '0'),
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
    status: opts.eventStatus ?? 'published',
  });
  const ticketTypeId = randomUUID();
  await client.db.insert(ticketTypeTable).values({
    id: ticketTypeId,
    eventId,
    name: 'General',
    price: '50.00',
    stock: opts.stock ?? 100,
    sold: opts.sold ?? 0,
  });
  return { eventId, ticketTypeId };
}

describe('DrizzleInventoryRepository (integration)', () => {
  it('round-trip: getEvent / getTicketType leen el estado de venta', async () => {
    const { eventId, ticketTypeId } = await seedInventory({ stock: 80, sold: 5 });

    const saleEvent = await repo.getEvent(eventId);
    expect(saleEvent).not.toBeNull();
    expect(saleEvent?.id).toBe(eventId);
    expect(saleEvent?.status).toBe('published');
    expect(saleEvent?.isOnSale).toBe(true);

    const tt = await repo.getTicketType(ticketTypeId);
    expect(tt).not.toBeNull();
    expect(tt?.id).toBe(ticketTypeId);
    expect(tt?.eventId).toBe(eventId);
    expect(tt?.price).toBe(50);
    expect(tt?.stock).toBe(80);
    expect(tt?.sold).toBe(5);
  });

  it('getEvent marca isOnSale=false si el evento no está publicado', async () => {
    const { eventId } = await seedInventory({ eventStatus: 'draft' });
    const saleEvent = await repo.getEvent(eventId);
    expect(saleEvent?.isOnSale).toBe(false);
  });

  it('incrementSold suma unidades vendidas dentro del stock', async () => {
    const { ticketTypeId } = await seedInventory({ stock: 100, sold: 0 });
    await repo.incrementSold(ticketTypeId, 3, undefined);

    const tt = await repo.getTicketType(ticketTypeId);
    expect(tt?.sold).toBe(3);
  });

  it('CHECK sold<=stock: una sobreventa (sold > stock) es rechazada por la BD', async () => {
    const { ticketTypeId } = await seedInventory({ stock: 10, sold: 8 });
    // 8 + 5 = 13 > 10 → la CHECK ticket_type_sold_check revierte la operación.
    await expect(repo.incrementSold(ticketTypeId, 5, undefined)).rejects.toThrow();

    // El estado sigue intacto tras el rechazo.
    const tt = await repo.getTicketType(ticketTypeId);
    expect(tt?.sold).toBe(8);
  });

  it('incrementEventTicketsSold e incrementEventCheckins suman contadores del evento', async () => {
    const { eventId } = await seedInventory();
    await repo.incrementEventTicketsSold(eventId, 4, undefined);
    await repo.incrementEventCheckins(eventId, undefined);

    const [row] = await client.db
      .select({ ticketsSold: eventTable.ticketsSold, checkinsCount: eventTable.checkinsCount })
      .from(eventTable)
      .where(eq(eventTable.id, eventId))
      .limit(1);
    expect(row?.ticketsSold).toBe(4);
    expect(row?.checkinsCount).toBe(1);
  });
});
