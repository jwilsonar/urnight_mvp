import { resolve } from 'node:path';
import { createDbClient, type DbClient } from '@urnight/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

/**
 * Conexión a la BD de integración (Postgres efímero del docker-compose, puerto
 * 5433 — NUNCA 5432 de producción). Base aislada `urnight_test`, distinta de
 * `urnight_dev`, creada y migrada por `ensureTestDbMigrated`.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://urnight:urnight@localhost:5433/urnight_test';

/** Base de mantenimiento para emitir CREATE DATABASE (no admite Tx). */
const ADMIN_DATABASE_URL =
  process.env.TEST_ADMIN_DATABASE_URL ??
  'postgresql://urnight:urnight@localhost:5433/urnight_dev';

const TEST_DB_NAME = process.env.TEST_DATABASE_NAME ?? 'urnight_test';

export function createTestDb(): DbClient {
  return createDbClient(TEST_DATABASE_URL);
}

/**
 * Idempotente: garantiza que `urnight_test` exista y aplica las migraciones de
 * drizzle-kit con el runner programático (drizzle-kit es CLI-only). Usado por el
 * globalSetup de integración y por el beforeAll del tier e2e.
 */
export async function ensureTestDbMigrated(): Promise<void> {
  const admin = createDbClient(ADMIN_DATABASE_URL);
  try {
    const rows = await admin.sql`SELECT 1 FROM pg_database WHERE datname = ${TEST_DB_NAME}`;
    if (rows.length === 0) {
      await admin.sql.unsafe(`CREATE DATABASE ${TEST_DB_NAME}`);
    }
  } finally {
    await admin.sql.end({ timeout: 5 });
  }

  const client = createDbClient(TEST_DATABASE_URL);
  try {
    await migrate(client.db, {
      migrationsFolder: resolve(process.cwd(), '../../packages/db/drizzle'),
    });
  } finally {
    await client.sql.end({ timeout: 5 });
  }
}

/** URL de una base de pruebas con nombre arbitrario en la instancia 5433. */
export function namedTestDatabaseUrl(dbName: string): string {
  return `postgresql://urnight:urnight@localhost:5433/${dbName}`;
}

/** Cliente a una base de pruebas con nombre propio (aislamiento por archivo/BC). */
export function createNamedTestDb(dbName: string): DbClient {
  return createDbClient(namedTestDatabaseUrl(dbName));
}

/**
 * Idempotente: crea la base `dbName` (si falta) y aplica las migraciones.
 * Permite que cada spec e2e use su PROPIA base → seguro en paralelo sin
 * depender de la config (que no fija fileParallelism).
 */
export async function ensureNamedDbMigrated(dbName: string): Promise<void> {
  const admin = createDbClient(ADMIN_DATABASE_URL);
  try {
    const rows = await admin.sql`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (rows.length === 0) {
      await admin.sql.unsafe(`CREATE DATABASE ${dbName}`);
    }
  } finally {
    await admin.sql.end({ timeout: 5 });
  }

  const client = createNamedTestDb(dbName);
  try {
    await migrate(client.db, {
      migrationsFolder: resolve(process.cwd(), '../../packages/db/drizzle'),
    });
  } finally {
    await client.sql.end({ timeout: 5 });
  }
}

/** Tablas del bounded context Identity (snake_case; `user` es palabra reservada). */
const IDENTITY_TABLES = [
  '"user"',
  'role',
  'user_role',
  'user_preference',
  'legal_document',
  'legal_acceptance',
] as const;

/** Limpia las tablas del módulo entre tests (truncate, no drop). CASCADE por las FK. */
export async function truncateIdentity(client: DbClient): Promise<void> {
  await client.sql.unsafe(
    `TRUNCATE ${IDENTITY_TABLES.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

/**
 * Trunca TODAS las tablas del esquema public (menos la de control de migraciones).
 * Agnóstico de módulo — para specs que cruzan bounded contexts por FK
 * (events→local, ticketing→event/user, etc.).
 */
const truncateStatements = new WeakMap<DbClient, string>();

export async function truncateAll(client: DbClient): Promise<void> {
  // El esquema no cambia durante una corrida, así que la lista de tablas se
  // resuelve una sola vez por cliente: esto se ejecuta en el beforeEach de cada
  // test y la consulta a pg_tables se pagaba cientos de veces por suite.
  let statement = truncateStatements.get(client);
  if (statement === undefined) {
    const rows = await client.sql<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'`;
    if (rows.length === 0) return;
    const list = rows.map((r) => `"${r.tablename}"`).join(', ');
    statement = `TRUNCATE ${list} RESTART IDENTITY CASCADE`;
    truncateStatements.set(client, statement);
  }
  await client.sql.unsafe(statement);
}
