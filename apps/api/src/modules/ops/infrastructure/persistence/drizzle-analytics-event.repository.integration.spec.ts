import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, analyticsEvent as analyticsEventTable, user as userTable } from '@urnight/db';
import { eq } from 'drizzle-orm';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzleAnalyticsEventRepository } from './drizzle-analytics-event.repository';

let client: DbClient;
let repo: DrizzleAnalyticsEventRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleAnalyticsEventRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra un user (FK opcional set-null de analytics_event.user_id). */
async function seedUser(): Promise<string> {
  const userId = randomUUID();
  await client.db.insert(userTable).values({
    id: userId,
    fullName: 'Analytics Tester',
    email: `${userId}@example.com`,
  });
  return userId;
}

describe('DrizzleAnalyticsEventRepository (integration)', () => {
  it('round-trip: record persiste el evento con properties y user_id', async () => {
    const userId = await seedUser();
    const id = randomUUID();
    await repo.record({
      id,
      userId,
      sessionId: 'sess-123',
      eventName: 'event_viewed',
      eventId: null,
      localId: null,
      zoneId: null,
      properties: { source: 'home', position: 3 },
    });

    const [row] = await client.db
      .select()
      .from(analyticsEventTable)
      .where(eq(analyticsEventTable.id, id));
    expect(row).toBeDefined();
    expect(row?.userId).toBe(userId);
    expect(row?.sessionId).toBe('sess-123');
    expect(row?.eventName).toBe('event_viewed');
    expect(row?.properties).toEqual({ source: 'home', position: 3 });
  });

  it('record admite evento anonimo (user_id null) y properties null', async () => {
    const id = randomUUID();
    await repo.record({
      id,
      userId: null,
      sessionId: null,
      eventName: 'page_view',
      eventId: null,
      localId: null,
      zoneId: null,
      properties: null,
    });

    const [row] = await client.db
      .select()
      .from(analyticsEventTable)
      .where(eq(analyticsEventTable.id, id));
    expect(row?.userId).toBeNull();
    expect(row?.eventName).toBe('page_view');
    expect(row?.properties).toBeNull();
  });
});
