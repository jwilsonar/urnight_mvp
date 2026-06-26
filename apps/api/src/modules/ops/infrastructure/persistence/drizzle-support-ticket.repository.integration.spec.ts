import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type DbClient,
  company as companyTable,
  local as localTable,
  user as userTable,
} from '@urnight/db';
import { SupportTicket } from '../../domain/entities/support-ticket.entity';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleSupportTicketRepository } from './drizzle-support-ticket.repository';

let client: DbClient;
let repo: DrizzleSupportTicketRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleSupportTicketRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra user + local (FK opcionales de support_ticket: opened_by, local_id). */
async function seedUserAndLocal(): Promise<{ userId: string; localId: string }> {
  const userId = randomUUID();
  await client.db.insert(userTable).values({
    id: userId,
    fullName: 'Soporte Tester',
    email: `${userId}@example.com`,
  });
  const companyId = randomUUID();
  await client.db.insert(companyTable).values({
    id: companyId,
    legalName: 'ACME SAC',
    ruc: '20123456789',
    commercialName: 'ACME',
  });
  const localId = randomUUID();
  await client.db.insert(localTable).values({
    id: localId,
    companyId,
    name: 'Local Centro',
    slug: `local-${localId}`,
  });
  return { userId, localId };
}

function buildTicket(ticketCode: string, openedBy: string, localId: string): SupportTicket {
  return SupportTicket.open({
    id: randomUUID(),
    ticketCode,
    openedBy,
    localId,
    subject: 'Puerta no valida QR',
    description: 'El validador rechaza tickets validos',
    category: 'incident',
    priority: 'high',
  });
}

describe('DrizzleSupportTicketRepository (integration)', () => {
  it('round-trip: create + findById conserva campos y FK', async () => {
    const { userId, localId } = await seedUserAndLocal();
    const ticket = buildTicket('SUP-0001', userId, localId);
    await repo.create(ticket);

    const found = await repo.findById(ticket.id);
    expect(found).not.toBeNull();
    expect(found?.ticketCode).toBe('SUP-0001');
    expect(found?.openedBy).toBe(userId);
    expect(found?.localId).toBe(localId);
    expect(found?.category).toBe('incident');
    expect(found?.priority).toBe('high');
    expect(found?.status).toBe('open');
  });

  it('UNIQUE ticket_code: el segundo insert con el mismo codigo es rechazado por la BD', async () => {
    const { userId, localId } = await seedUserAndLocal();
    await repo.create(buildTicket('SUP-DUP', userId, localId));
    await expect(repo.create(buildTicket('SUP-DUP', userId, localId))).rejects.toThrow();
  });

  it('update persiste el cambio de estado del ticket', async () => {
    const { userId, localId } = await seedUserAndLocal();
    const ticket = buildTicket('SUP-0002', userId, localId);
    await repo.create(ticket);
    ticket.changeStatus('resolved');
    await repo.update(ticket);

    const found = await repo.findById(ticket.id);
    expect(found?.status).toBe('resolved');
  });
});
