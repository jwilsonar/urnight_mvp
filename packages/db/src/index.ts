import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export { schema };
export * from './schema';
export * from './availability';

/**
 * Factory ÚNICA de conexión (DRY). La usan api y worker.
 * postgres.js con pooling nativo recomendado por Drizzle (§1.1).
 */
export function createDbClient(url: string) {
  const sql = postgres(url, {
    max: 15,
    idle_timeout: 60,
    connect_timeout: 30,
  });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type DbClient = ReturnType<typeof createDbClient>;
export type Database = DbClient['db'];
export type Sql = DbClient['sql'];
