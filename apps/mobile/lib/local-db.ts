import * as SQLite from 'expo-sqlite';

/**
 * Base local del canal del asistente. Un único punto de apertura y migración,
 * como `apps/validator/lib/offline-cache.ts`.
 *
 * Dos tablas sin relación entre sí: `ticket_cache` es la copia de la billetera
 * para operar sin red (SD-06) y `checkout_draft` guarda el borrador con su clave
 * de idempotencia (SD-05). Comparten fichero, no responsabilidad: cada una tiene
 * su módulo de acceso.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('ravenue-mobile.db').then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ticket_cache (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          synced_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS checkout_draft (
          event_id TEXT PRIMARY KEY,
          idempotency_key TEXT NOT NULL,
          dto TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}
