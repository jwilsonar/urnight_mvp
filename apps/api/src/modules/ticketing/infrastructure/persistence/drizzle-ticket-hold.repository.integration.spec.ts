import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  event as eventTable,
  local as localTable,
  ticketHold as ticketHoldTable,
  ticketType as ticketTypeTable,
  user as userTable,
} from '@urnight/db';
import { eq } from 'drizzle-orm';
import {
  createTestDb,
  truncateAll,
} from '../../../../shared/testing/integration/test-db';
import { UnitOfWork, type Tx } from '../../../../shared/unit-of-work/unit-of-work';
import { CreateTicketHoldUseCase } from '../../application/use-cases/create-ticket-hold.use-case';
import { InsufficientCapacityError } from '../../domain/errors/checkout.errors';
import { DrizzleInventoryRepository } from './drizzle-inventory.repository';
import { DrizzleTicketHoldRepository } from './drizzle-ticket-hold.repository';

let client: DbClient;
let holds: DrizzleTicketHoldRepository;
let inventory: DrizzleInventoryRepository;
let useCase: CreateTicketHoldUseCase;

class TestUnitOfWork extends UnitOfWork {
  constructor(private readonly db: DbClient['db']) {
    super();
  }

  run<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(work);
  }
}

beforeAll(() => {
  client = createTestDb();
  holds = new DrizzleTicketHoldRepository(client.db);
  inventory = new DrizzleInventoryRepository(client.db);
  useCase = new CreateTicketHoldUseCase(
    holds,
    inventory,
    new TestUnitOfWork(client.db),
    10 * 60 * 1000,
  );
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

async function seedLastCapacity() {
  const firstUserId = randomUUID();
  const secondUserId = randomUUID();
  await client.db.insert(userTable).values([
    {
      id: firstUserId,
      fullName: 'Primera persona',
      email: `first-${firstUserId}@example.com`,
    },
    {
      id: secondUserId,
      fullName: 'Segunda persona',
      email: `second-${secondUserId}@example.com`,
    },
  ]);
  const companyId = randomUUID();
  await client.db.insert(companyTable).values({
    id: companyId,
    legalName: 'Empresa Holds',
    ruc: randomUUID().replace(/\D/g, '').slice(0, 11).padEnd(11, '0'),
    commercialName: 'Empresa Holds',
    status: 'active',
  });
  const localId = randomUUID();
  await client.db.insert(localTable).values({
    id: localId,
    companyId,
    name: 'Local Holds',
    slug: `local-${localId}`,
    status: 'active',
  });
  const eventId = randomUUID();
  await client.db.insert(eventTable).values({
    id: eventId,
    localId,
    name: 'Evento Holds',
    slug: `evento-${eventId}`,
    startsAt: new Date('2026-08-01T03:00:00.000Z'),
    totalCapacity: 1,
    status: 'published',
  });
  const ticketTypeId = randomUUID();
  await client.db.insert(ticketTypeTable).values({
    id: ticketTypeId,
    eventId,
    name: 'Último cupo',
    price: '50.00',
    stock: 1,
    sold: 0,
    status: 'active',
  });
  return {
    firstUserId,
    secondUserId,
    eventId,
    ticketTypeId,
  };
}

describe('DrizzleTicketHoldRepository (integration)', () => {
  it('serializa dos transacciones por el último cupo: gana exactamente una', async () => {
    const seed = await seedLastCapacity();
    const dto = {
      eventId: seed.eventId,
      ticketTypeId: seed.ticketTypeId,
      quantity: 1,
    };
    const scope = { isSuperAdmin: false, companyId: null };
    const now = new Date('2026-07-30T12:00:00.000Z');

    const results = await Promise.allSettled([
      useCase.execute({
        userId: seed.firstUserId,
        scope,
        dto,
        now,
      }),
      useCase.execute({
        userId: seed.secondUserId,
        scope,
        dto,
        now,
      }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    expect(rejected?.reason).toBeInstanceOf(InsufficientCapacityError);

    const rows = await client.db
      .select()
      .from(ticketHoldTable)
      .where(eq(ticketHoldTable.status, 'active'));
    expect(rows).toHaveLength(1);
  });

  it('un hold vencido libera el cupo sin esperar al worker', async () => {
    const seed = await seedLastCapacity();
    const scope = { isSuperAdmin: false, companyId: null };

    await useCase.execute({
      userId: seed.firstUserId,
      scope,
      dto: {
        eventId: seed.eventId,
        ticketTypeId: seed.ticketTypeId,
        quantity: 1,
      },
      now: new Date('2026-07-30T11:40:00.000Z'),
    });

    const replacement = await useCase.execute({
      userId: seed.secondUserId,
      scope,
      dto: {
        eventId: seed.eventId,
        ticketTypeId: seed.ticketTypeId,
        quantity: 1,
      },
      now: new Date('2026-07-30T12:00:01.000Z'),
    });

    expect(replacement.userId).toBe(seed.secondUserId);
    expect(replacement.status).toBe('active');
  });
});
