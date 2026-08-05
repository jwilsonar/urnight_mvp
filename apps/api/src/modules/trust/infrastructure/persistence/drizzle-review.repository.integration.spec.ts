import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  company,
  type DbClient,
  event,
  local,
  order,
  orderItem,
  review as reviewTable,
  ticket,
  ticketType,
  user,
} from '@urnight/db';
import { Review } from '../../domain/entities/review.entity';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleReviewRepository } from './drizzle-review.repository';

let client: DbClient;
let repo: DrizzleReviewRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleReviewRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

interface SeedIds {
  userId: string;
  companyId: string;
  localId: string;
  eventId: string;
  ticketTypeId: string;
  orderId: string;
  orderItemId: string;
  ticketId: string;
}

/** Siembra la cadena de FK (user/company/local/event/ticket) necesaria para una review. */
async function seedChain(): Promise<SeedIds> {
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
    fullName: 'Reseñador',
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
    status: 'used',
  });

  return { userId, companyId, localId, eventId, ticketTypeId, orderId, orderItemId, ticketId };
}

async function seedAdditionalTicket(seed: SeedIds): Promise<string> {
  const orderItemId = randomUUID();
  const ticketId = randomUUID();
  await client.db.insert(orderItem).values({
    id: orderItemId,
    orderId: seed.orderId,
    ticketTypeId: seed.ticketTypeId,
    quantity: 1,
    unitPrice: '50.00',
    lineTotal: '50.00',
  });
  await client.db.insert(ticket).values({
    id: ticketId,
    orderItemId,
    eventId: seed.eventId,
    ticketTypeId: seed.ticketTypeId,
    qrCode: `QR-${ticketId}`.slice(0, 64),
    status: 'used',
  });
  return ticketId;
}

describe('DrizzleReviewRepository (integration)', () => {
  it('round-trip: create persiste y listByTarget devuelve la reseña fiel', async () => {
    const seed = await seedChain();
    const entity = Review.create({
      id: randomUUID(),
      userId: seed.userId,
      targetType: 'local',
      localId: seed.localId,
      ticketId: seed.ticketId,
      rating: 5,
      comment: 'Excelente',
      quickTags: ['limpio', 'seguro'],
      isVerified: true,
    });

    const created = await repo.create(entity);
    expect(created.id).toBe(entity.id);
    expect(created.rating).toBe(5);

    const list = await repo.listByTarget({ localId: seed.localId });
    expect(list).toHaveLength(1);
    const found = list[0];
    expect(found?.id).toBe(entity.id);
    expect(found?.userId).toBe(seed.userId);
    expect(found?.localId).toBe(seed.localId);
    expect(found?.eventId).toBeNull();
    expect(found?.ticketId).toBe(seed.ticketId);
    expect(found?.rating).toBe(5);
    expect(found?.comment).toBe('Excelente');
    expect(found?.quickTags).toEqual(['limpio', 'seguro']);
    expect(found?.isVerified).toBe(true);
    expect(found?.status).toBe('published');
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it('listByTarget devuelve solo reseñas publicadas (oculta las hidden)', async () => {
    const seed = await seedChain();
    const hiddenTicketId = await seedAdditionalTicket(seed);
    const published = Review.create({
      id: randomUUID(),
      userId: seed.userId,
      targetType: 'local',
      localId: seed.localId,
      ticketId: hiddenTicketId,
      rating: 4,
      isVerified: true,
    });
    const hidden = Review.create({
      id: randomUUID(),
      userId: seed.userId,
      targetType: 'local',
      localId: seed.localId,
      ticketId: seed.ticketId,
      rating: 1,
      isVerified: true,
    });
    hidden.hide();
    await repo.create(published);
    await repo.create(hidden);

    const list = await repo.listByTarget({ localId: seed.localId });
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(published.id);
    expect(list[0]?.status).toBe('published');
  });

  it('listByTarget filtra por local vs evento (no mezcla targets)', async () => {
    const seed = await seedChain();
    const eventTicketId = await seedAdditionalTicket(seed);
    const byLocal = Review.create({
      id: randomUUID(),
      userId: seed.userId,
      targetType: 'local',
      localId: seed.localId,
      ticketId: seed.ticketId,
      rating: 5,
      isVerified: true,
    });
    const byEvent = Review.create({
      id: randomUUID(),
      userId: seed.userId,
      targetType: 'event',
      eventId: seed.eventId,
      ticketId: eventTicketId,
      rating: 3,
      isVerified: true,
    });
    await repo.create(byLocal);
    await repo.create(byEvent);

    const localList = await repo.listByTarget({ localId: seed.localId });
    expect(localList).toHaveLength(1);
    expect(localList[0]?.id).toBe(byLocal.id);

    const eventList = await repo.listByTarget({ eventId: seed.eventId });
    expect(eventList).toHaveLength(1);
    expect(eventList[0]?.id).toBe(byEvent.id);
  });

  it('listByTarget sin coincidencias devuelve una lista vacía', async () => {
    const seed = await seedChain();
    const byLocal = Review.create({
      id: randomUUID(),
      userId: seed.userId,
      targetType: 'local',
      localId: seed.localId,
      ticketId: seed.ticketId,
      rating: 5,
      isVerified: true,
    });
    await repo.create(byLocal);

    expect(await repo.listByTarget({ eventId: seed.eventId })).toEqual([]);
  });

  it('CHECK polimórfico: una review con local y event a la vez es rechazada', async () => {
    const seed = await seedChain();
    await expect(
      client.db.insert(reviewTable).values({
        id: randomUUID(),
        userId: seed.userId,
        targetType: 'local',
        localId: seed.localId,
        eventId: seed.eventId,
        ticketId: seed.ticketId,
        rating: 5,
        status: 'published',
      }),
    ).rejects.toThrow();
  });
});
