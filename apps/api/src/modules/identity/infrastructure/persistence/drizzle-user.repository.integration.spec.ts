import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DbClient } from '@urnight/db';
import { PersonalIdBuilder, UserBuilder } from '../../../../shared/testing';
import { createTestDb, truncateIdentity } from '../../../../shared/testing/integration/test-db';
import { DrizzleUserRepository } from './drizzle-user.repository';

let client: DbClient;
let repo: DrizzleUserRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleUserRepository(client.db);
});
afterEach(async () => {
  await truncateIdentity(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

describe('DrizzleUserRepository (integration)', () => {
  it('round-trip: create + findById conserva identidad y campos', async () => {
    const user = new UserBuilder().withEmail('ada@example.com').build();
    await repo.create(user);

    const found = await repo.findById(user.id);
    expect(found).not.toBeNull();
    expect(found?.email).toBe('ada@example.com');
    expect(found?.identity?.documentNumber).toBe('12345678');
    expect(found?.authProvider).toBe('email');
    expect(found?.emailVerified).toBe(false);
  });

  it('findByEmail (case-insensitive) / findByDocumentNumber / existsByEmail', async () => {
    const user = new UserBuilder().withEmail('grace@example.com').build();
    await repo.create(user);

    expect((await repo.findByEmail('GRACE@example.com'))?.id).toBe(user.id);
    expect((await repo.findByDocumentNumber('12345678'))?.id).toBe(user.id);
    expect(await repo.existsByEmail('grace@example.com')).toBe(true);
    expect(await repo.existsByEmail('nobody@example.com')).toBe(false);
  });

  it('UNIQUE email: el segundo insert con el mismo email es rechazado por la BD', async () => {
    await repo.create(new UserBuilder().withEmail('dup@example.com').build());
    const other = new UserBuilder()
      .withEmail('dup@example.com')
      .withIdentity(new PersonalIdBuilder().withNumber('99999999').build())
      .build();
    await expect(repo.create(other)).rejects.toThrow();
  });

  it('update persiste mutaciones del aggregate (emailVerified, lastLogin)', async () => {
    const user = new UserBuilder().withEmail('marie@example.com').build();
    await repo.create(user);
    user.markEmailVerified();
    user.recordLogin(new Date());
    await repo.update(user);

    const found = await repo.findById(user.id);
    expect(found?.emailVerified).toBe(true);
    expect(found?.lastLoginAt).not.toBeNull();
  });
});
