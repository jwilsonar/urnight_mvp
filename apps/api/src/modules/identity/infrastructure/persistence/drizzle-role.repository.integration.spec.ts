import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, role as roleTable } from '@urnight/db';
import type { Role } from '../../domain/entities/role.entity';
import { RoleMother } from '../../../../shared/testing';
import { createTestDb, truncateIdentity } from '../../../../shared/testing/integration/test-db';
import { DrizzleRoleRepository } from './drizzle-role.repository';

let client: DbClient;
let repo: DrizzleRoleRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzleRoleRepository(client.db);
});
afterEach(async () => {
  await truncateIdentity(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

async function seedRole(role: Role = RoleMother.user()): Promise<Role> {
  await client.db.insert(roleTable).values({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
  });
  return role;
}

describe('DrizzleRoleRepository (integration)', () => {
  it('findByCode / findById / listAll', async () => {
    const userRole = await seedRole(RoleMother.user());
    const adminRole = await seedRole(RoleMother.adminLocal());

    expect((await repo.findByCode('user'))?.id).toBe(userRole.id);
    expect((await repo.findById(adminRole.id))?.code).toBe('admin_local');
    expect(await repo.listAll()).toHaveLength(2);
  });

  it('findByCode inexistente → null', async () => {
    expect(await repo.findByCode('promoter')).toBeNull();
  });

  it('UNIQUE code: dos roles con el mismo code son rechazados', async () => {
    await seedRole(RoleMother.user());
    await expect(seedRole(RoleMother.user())).rejects.toThrow();
  });
});
