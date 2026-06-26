import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, role as roleTable } from '@urnight/db';
import type { Role } from '../../domain/entities/role.entity';
import type { User } from '../../domain/entities/user.entity';
import { RoleAssignmentBuilder, RoleMother, UserBuilder } from '../../../../shared/testing';
import { createTestDb, truncateIdentity } from '../../../../shared/testing/integration/test-db';
import { DrizzleRoleAssignmentRepository } from './drizzle-role-assignment.repository';
import { DrizzleUserRepository } from './drizzle-user.repository';

let client: DbClient;
let repo: DrizzleRoleAssignmentRepository;
let users: DrizzleUserRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleRoleAssignmentRepository(client.db);
  users = new DrizzleUserRepository(client.db);
});
afterEach(async () => {
  await truncateIdentity(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

/** Siembra usuario + rol (necesarios por las FK de user_role). */
async function seedUserAndRole(): Promise<{ user: User; role: Role }> {
  const user = new UserBuilder().build();
  await users.create(user);
  const role = RoleMother.adminLocal();
  await client.db.insert(roleTable).values({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
  });
  return { user, role };
}

describe('DrizzleRoleAssignmentRepository (integration)', () => {
  it('round-trip: create + findById', async () => {
    const { user, role } = await seedUserAndRole();
    const assignment = new RoleAssignmentBuilder().withUserId(user.id).withRoleId(role.id).build();
    await repo.create(assignment);

    const found = await repo.findById(assignment.id);
    expect(found?.userId).toBe(user.id);
    expect(found?.roleId).toBe(role.id);
    expect(found?.isActive).toBe(true);
  });

  it('findActiveByUser devuelve solo las asignaciones activas del usuario', async () => {
    const { user, role } = await seedUserAndRole();
    const active = new RoleAssignmentBuilder().withUserId(user.id).withRoleId(role.id).build();
    const revoked = new RoleAssignmentBuilder()
      .withUserId(user.id)
      .withRoleId(role.id)
      .withScope(randomUUID(), null)
      .build();
    revoked.revoke();
    await repo.create(active);
    await repo.create(revoked);

    const list = await repo.findActiveByUser(user.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(active.id);
  });

  it('exists aísla el scope multi-tenant (company A no es visible desde company B)', async () => {
    const { user, role } = await seedUserAndRole();
    const companyA = randomUUID();
    const companyB = randomUUID();
    await repo.create(
      new RoleAssignmentBuilder().withUserId(user.id).withRoleId(role.id).withScope(companyA, null).build(),
    );

    expect(await repo.exists(user.id, role.id, { companyId: companyA, localId: null })).toBe(true);
    expect(await repo.exists(user.id, role.id, { companyId: companyB, localId: null })).toBe(false);
    expect(await repo.exists(user.id, role.id, { companyId: null, localId: null })).toBe(false);
  });
});
