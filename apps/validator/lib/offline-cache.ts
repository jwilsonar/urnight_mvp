import type { QrValidationResponse } from '@urnight/contracts';
import * as SQLite from 'expo-sqlite';
import { createLogger } from './logger';

/**
 * Cache local tolerante a red (§5 offline en puerta). Guarda check-ins
 * pendientes cuando no hay conexión; se sincronizan al recuperar red.
 */
const log = createLogger('offline-cache');
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('urnight-validator.db').then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS pending_checkin (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          qr_code TEXT NOT NULL,
          scanned_at TEXT NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0
        );
      `);
      // Dedupe (M20): un QR no puede encolarse dos veces. Sin esto, A→B→A
      // insertaba A dos veces y disparaba un falso `already_used` al sincronizar.
      // En su propio try/catch para no romper la init si un DB antiguo ya tenía
      // duplicados (escenario de scaffold, sin datos reales).
      try {
        await db.execAsync(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_checkin_qr ON pending_checkin(qr_code);',
        );
      } catch (err) {
        log.warn({ err: (err as Error).message }, 'validator.cache.unique_index_skipped');
      }
      return db;
    });
  }
  return dbPromise;
}

/**
 * Encola un check-in offline. `INSERT OR IGNORE` + UNIQUE(qr_code) deduplican
 * (M20): un QR ya encolado no se vuelve a insertar. NUNCA logueamos el
 * contenido del QR (§6). `scannedAt` guarda la hora real del escaneo para uso
 * futuro (M20/scannedAt) — hoy no viaja al backend porque ValidateQrDto en
 * contracts no lo acepta.
 */
export async function queueCheckin(qrCode: string, scannedAt?: string): Promise<void> {
  const db = await getDb();
  const res = await db.runAsync('INSERT OR IGNORE INTO pending_checkin (qr_code, scanned_at) VALUES (?, ?)', [
    qrCode,
    scannedAt ?? new Date().toISOString(),
  ]);
  const pending = await countPending();
  log.info({ pending, deduped: res.changes === 0 }, 'validator.checkin.queued');
}

/** Cuenta check-ins pendientes de sincronizar. */
export async function countPending(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM pending_checkin WHERE synced = 0',
  );
  return row?.n ?? 0;
}

export interface PendingCheckin {
  id: number;
  qr_code: string;
  scanned_at: string;
}

/** Check-ins pendientes (orden de llegada). */
export async function listPending(): Promise<PendingCheckin[]> {
  const db = await getDb();
  return db.getAllAsync<PendingCheckin>(
    'SELECT id, qr_code, scanned_at FROM pending_checkin WHERE synced = 0 ORDER BY id ASC',
  );
}

/** Marca un check-in como sincronizado. */
export async function markSynced(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE pending_checkin SET synced = 1 WHERE id = ?', [id]);
}

/**
 * Sincroniza los check-ins pendientes al recuperar red (§5). `sync` postea cada
 * QR al backend (recibe también la hora del escaneo, `scannedAt`, para uso
 * futuro) y devuelve el veredicto, que logueamos por trazabilidad — antes se
 * descartaba. Ante el primer fallo de red se detiene y reintenta más tarde.
 * Devuelve cuántos se sincronizaron.
 */
export async function syncPending(
  sync: (qrCode: string, scannedAt: string) => Promise<QrValidationResponse>,
): Promise<number> {
  const pending = await listPending();
  let synced = 0;
  for (const item of pending) {
    try {
      const res = await sync(item.qr_code, item.scanned_at);
      await markSynced(item.id);
      synced += 1;
      log.info({ id: item.id, result: res.result }, 'validator.sync.item_done');
    } catch (err) {
      log.warn({ id: item.id, err: (err as Error).message }, 'validator.sync.item_failed');
      break;
    }
  }
  if (synced > 0) log.info({ synced }, 'validator.sync.done');
  return synced;
}
