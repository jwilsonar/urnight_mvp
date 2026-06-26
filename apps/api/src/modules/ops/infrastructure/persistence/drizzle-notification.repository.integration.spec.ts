import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, notification as notificationTable, user as userTable } from '@urnight/db';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleNotificationRepository } from './drizzle-notification.repository';

let client: DbClient;
let repo: DrizzleNotificationRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleNotificationRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra un user (FK notnull/cascade de notification.user_id). */
async function seedUser(): Promise<string> {
  const userId = randomUUID();
  await client.db.insert(userTable).values({
    id: userId,
    fullName: 'Notif Tester',
    email: `${userId}@example.com`,
  });
  return userId;
}

describe('DrizzleNotificationRepository (integration)', () => {
  it('round-trip: listByUser devuelve la notificacion sembrada con sus campos', async () => {
    const userId = await seedUser();
    await client.db.insert(notificationTable).values({
      id: randomUUID(),
      userId,
      channel: 'email',
      type: 'ticket_purchased',
      subject: 'Compra confirmada',
      status: 'sent',
    });

    const list = await repo.listByUser(userId);
    expect(list).toHaveLength(1);
    expect(list[0]?.channel).toBe('email');
    expect(list[0]?.type).toBe('ticket_purchased');
    expect(list[0]?.subject).toBe('Compra confirmada');
    expect(list[0]?.status).toBe('sent');
  });

  it('listByUser ordena por created_at descendente (la mas reciente primero)', async () => {
    const userId = await seedUser();
    const oldId = randomUUID();
    const newId = randomUUID();
    await client.db.insert(notificationTable).values({
      id: oldId,
      userId,
      type: 'old_event',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    await client.db.insert(notificationTable).values({
      id: newId,
      userId,
      type: 'new_event',
      createdAt: new Date('2024-06-01T00:00:00.000Z'),
    });

    const list = await repo.listByUser(userId);
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe(newId);
    expect(list[1]?.id).toBe(oldId);
  });

  it('listByUser aisla por usuario (no devuelve notificaciones de otros)', async () => {
    const userA = await seedUser();
    const userB = await seedUser();
    await client.db.insert(notificationTable).values({
      id: randomUUID(),
      userId: userB,
      type: 'other_user',
    });

    expect(await repo.listByUser(userA)).toHaveLength(0);
  });
});
