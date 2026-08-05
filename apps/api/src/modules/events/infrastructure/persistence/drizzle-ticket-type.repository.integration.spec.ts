import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, company, local } from '@urnight/db';
import { Event } from '../../domain/entities/event.entity';
import { TicketType, type TicketTier } from '../../domain/entities/ticket-type.entity';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleEventRepository } from './drizzle-event.repository';
import { DrizzleTicketTypeRepository } from './drizzle-ticket-type.repository';

let client: DbClient;
let repo: DrizzleTicketTypeRepository;
let events: DrizzleEventRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleTicketTypeRepository(client.db);
  events = new DrizzleEventRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra company + local + event (cadena de FK: ticket_type → event → local). */
async function seedEvent(): Promise<string> {
  const companyId = randomUUID();
  const localId = randomUUID();
  const suffix = randomUUID().slice(0, 8);
  await client.db.insert(company).values({
    id: companyId,
    legalName: `Disco SAC ${suffix}`,
    ruc: String(Date.now()).slice(-11).padStart(11, '0'),
    commercialName: `Disco ${suffix}`,
  });
  await client.db.insert(local).values({
    id: localId,
    companyId,
    name: `Local ${suffix}`,
    slug: `local-${suffix}`,
  });
  const event = Event.create({
    id: randomUUID(),
    localId,
    name: `Fiesta ${suffix}`,
    slug: `fiesta-${suffix}`,
    startsAt: new Date('2026-07-01T22:00:00.000Z'),
  });
  await events.create(event);
  return event.id;
}

function buildTicketType(
  eventId: string,
  overrides: Partial<{ tierCode: TicketTier; price: number; stock: number; name: string }> = {},
): TicketType {
  return TicketType.create({
    id: randomUUID(),
    eventId,
    name: overrides.name ?? 'Entrada',
    tierCode: overrides.tierCode ?? 'general',
    price: overrides.price ?? 50,
    currency: 'PEN',
    stock: overrides.stock ?? 100,
  });
}

describe('DrizzleTicketTypeRepository (integration)', () => {
  it('round-trip: create + findById conserva identidad y campos', async () => {
    const eventId = await seedEvent();
    const ticket = buildTicketType(eventId, { tierCode: 'vip', price: 120.5, stock: 30 });
    await repo.create(ticket);

    const found = await repo.findById(ticket.id);
    expect(found).not.toBeNull();
    expect(found?.eventId).toBe(eventId);
    expect(found?.tierCode).toBe('vip');
    expect(found?.price).toBe(120.5);
    expect(found?.stock).toBe(30);
    expect(found?.status).toBe('active');
  });

  it('findById inexistente → null', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('listByEvent lista los tipos del evento ordenados por precio asc', async () => {
    const eventId = await seedEvent();
    const vip = buildTicketType(eventId, { tierCode: 'vip', price: 150, name: 'VIP' });
    const general = buildTicketType(eventId, { tierCode: 'general', price: 50, name: 'General' });
    await repo.create(vip);
    await repo.create(general);

    const list = await repo.listByEvent(eventId);
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe(general.id);
    expect(list[1]?.id).toBe(vip.id);
  });

  it('listByEvent aísla por evento (no devuelve tipos de otro evento)', async () => {
    const eventA = await seedEvent();
    const eventB = await seedEvent();
    const inA = buildTicketType(eventA, { name: 'A' });
    const inB = buildTicketType(eventB, { name: 'B' });
    await repo.create(inA);
    await repo.create(inB);

    const list = await repo.listByEvent(eventA);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(inA.id);
    expect(list[0]?.eventId).toBe(eventA);
  });

  it('update persiste mutaciones del aggregate (status + sold)', async () => {
    const eventId = await seedEvent();
    const ticket = buildTicketType(eventId, { stock: 10 });
    await repo.create(ticket);

    const reloaded = await repo.findById(ticket.id);
    expect(reloaded?.sold).toBe(0);

    const mutated = TicketType.fromPersistence({
      id: ticket.id,
      eventId,
      name: ticket.name,
      tierCode: ticket.tierCode,
      price: ticket.price,
      currency: ticket.currency,
      stock: ticket.stock,
      sold: 5,
      available: 5,
      maxPerUser: ticket.maxPerUser,
      saleStartsAt: null,
      saleEndsAt: null,
      status: 'paused',
      createdAt: new Date(),
    });
    await repo.update(mutated);

    const found = await repo.findById(ticket.id);
    expect(found?.status).toBe('paused');
    expect(found?.sold).toBe(5);
  });
});
