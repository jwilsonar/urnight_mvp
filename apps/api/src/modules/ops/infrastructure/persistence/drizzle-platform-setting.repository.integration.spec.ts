import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type DbClient, platformSetting as platformSettingTable } from '@urnight/db';
import { PlatformSetting } from '../../domain/entities/platform-setting.entity';
import { createTestDb, truncateAll } from '../../../../shared/testing/integration/test-db';
import { DrizzlePlatformSettingRepository } from './drizzle-platform-setting.repository';

let client: DbClient;
let repo: DrizzlePlatformSettingRepository;

beforeAll(() => {
  client = createTestDb();
  repo = new DrizzlePlatformSettingRepository(client.db);
});
afterEach(async () => {
  await truncateAll(client);
});
afterAll(async () => {
  await client.sql.end({ timeout: 5 });
});

describe('DrizzlePlatformSettingRepository (integration)', () => {
  it('round-trip: upsert + findByKey conserva key/value/valueType', async () => {
    const setting = PlatformSetting.create({
      id: randomUUID(),
      key: 'commission_rate',
      value: '0.12',
      valueType: 'number',
    });
    await repo.upsert(setting);

    const found = await repo.findByKey('commission_rate');
    expect(found).not.toBeNull();
    expect(found?.key).toBe('commission_rate');
    expect(found?.value).toBe('0.12');
    expect(found?.valueType).toBe('number');
  });

  it('findByKey devuelve null cuando la key no existe', async () => {
    expect(await repo.findByKey('inexistente')).toBeNull();
  });

  it('UNIQUE key: upsert sobre la misma key actualiza el valor en lugar de duplicar', async () => {
    await repo.upsert(
      PlatformSetting.create({
        id: randomUUID(),
        key: 'maintenance_mode',
        value: 'false',
        valueType: 'boolean',
      }),
    );
    const updated = await repo.upsert(
      PlatformSetting.create({
        id: randomUUID(),
        key: 'maintenance_mode',
        value: 'true',
        valueType: 'boolean',
      }),
    );

    expect(updated.value).toBe('true');
    const rows = await client.db.select().from(platformSettingTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.value).toBe('true');
  });
});
