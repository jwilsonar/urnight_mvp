import { createTestDb, ensureTestDbMigrated, truncateAll } from './test-db';

/**
 * Vitest globalSetup del tier de integración: crea `urnight_test` (si falta),
 * aplica migraciones y limpia las tablas una vez como baseline (por si otra
 * corrida — p.ej. e2e — dejó datos). Entre tests, cada spec trunca en afterEach.
 * (El tier e2e migra/limpia desde su propio beforeAll/beforeEach.)
 */
export default async function setup(): Promise<void> {
  await ensureTestDbMigrated();
  const client = createTestDb();
  try {
    await truncateAll(client);
  } finally {
    await client.sql.end({ timeout: 5 });
  }
}
