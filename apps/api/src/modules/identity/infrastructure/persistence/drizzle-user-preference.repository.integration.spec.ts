import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DbClient } from '@urnight/db';
import type { User } from '../../domain/entities/user.entity';
import { UserBuilder, UserPreferenceBuilder } from '../../../../shared/testing';
import { createTestDb, truncateIdentity } from '../../../../shared/testing/integration/test-db';
import { DrizzleUserPreferenceRepository } from './drizzle-user-preference.repository';
import { DrizzleUserRepository } from './drizzle-user.repository';

let client: DbClient;
let repo: DrizzleUserPreferenceRepository;
let users: DrizzleUserRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleUserPreferenceRepository(client.db);
  users = new DrizzleUserRepository(client.db);
});
afterEach(async () => {
  await truncateIdentity(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra un usuario (FK user_preference.user_id → user). */
async function seedUser(): Promise<User> {
  const user = new UserBuilder().build();
  await users.create(user);
  return user;
}

describe('DrizzleUserPreferenceRepository (integration)', () => {
  it('round-trip: create + findByUser con defaults', async () => {
    const user = await seedUser();
    await repo.create(new UserPreferenceBuilder().withUserId(user.id).build());

    const found = await repo.findByUser(user.id);
    expect(found?.userId).toBe(user.id);
    expect(found?.preferredLocale).toBe('es-PE');
    expect(found?.acceptsReminders).toBe(true);
    expect(found?.onboardingCompleted).toBe(false);
  });

  it('update persiste el patch y completeOnboarding', async () => {
    const user = await seedUser();
    const pref = new UserPreferenceBuilder().withUserId(user.id).build();
    await repo.create(pref);
    pref.completeOnboarding();
    pref.update({ acceptsMarketing: true, preferredLocale: 'es-MX' });
    await repo.update(pref);

    const found = await repo.findByUser(user.id);
    expect(found?.onboardingCompleted).toBe(true);
    expect(found?.acceptsMarketing).toBe(true);
    expect(found?.preferredLocale).toBe('es-MX');
  });

  it('UNIQUE user_id: una segunda fila para el mismo usuario es rechazada', async () => {
    const user = await seedUser();
    await repo.create(new UserPreferenceBuilder().withUserId(user.id).build());
    await expect(
      repo.create(new UserPreferenceBuilder().withUserId(user.id).build()),
    ).rejects.toThrow();
  });
});
