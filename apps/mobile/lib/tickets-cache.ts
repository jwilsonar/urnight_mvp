import type { TicketResponse } from '@urnight/contracts';
import { getDb } from './local-db';
import { createLogger } from './logger';
import { reconcileTickets } from './tickets-reconcile';

const log = createLogger('tickets-cache');

interface CacheRow {
  id: string;
  payload: string;
  synced_at: string;
}

/**
 * Copia local de las entradas (SD-06). Se guarda el token `qrCode` dentro del
 * payload, nunca la imagen: pesa nada y permite dibujar el QR sin red.
 * NUNCA se registra el contenido del QR en el log (§6).
 */
export async function readCachedTickets(): Promise<{
  tickets: TicketResponse[];
  syncedAt: string | null;
}> {
  const db = await getDb();
  const rows = await db.getAllAsync<CacheRow>(
    'SELECT id, payload, synced_at FROM ticket_cache',
  );
  const tickets: TicketResponse[] = [];
  for (const row of rows) {
    try {
      tickets.push(JSON.parse(row.payload) as TicketResponse);
    } catch {
      // Fila corrupta de una versión anterior: se ignora, el refresco la repone.
    }
  }
  const syncedAt = rows.reduce<string | null>(
    (max, r) => (max === null || r.synced_at > max ? r.synced_at : max),
    null,
  );
  return { tickets, syncedAt };
}

/** Sincronización completa: sobrescribe lo devuelto y borra lo ausente. */
export async function writeTickets(fresh: TicketResponse[]): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM ticket_cache');
  const { upsert, deleteIds } = reconcileTickets(
    rows.map((r) => r.id),
    fresh,
  );
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const t of upsert) {
      await db.runAsync(
        'INSERT OR REPLACE INTO ticket_cache (id, payload, synced_at) VALUES (?, ?, ?)',
        [t.id, JSON.stringify(t), now],
      );
    }
    for (const id of deleteIds) {
      await db.runAsync('DELETE FROM ticket_cache WHERE id = ?', [id]);
    }
  });
  log.info(
    { upserted: upsert.length, deleted: deleteIds.length },
    'mobile.tickets.cache_synced',
  );
}

/**
 * Alta sin borrado, para las entradas recién emitidas en el checkout (SD-05
 * fase 4). No se puede usar `writeTickets` aquí: borraría todas las demás.
 */
export async function upsertTickets(tickets: TicketResponse[]): Promise<void> {
  if (tickets.length === 0) return;
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const t of tickets) {
      await db.runAsync(
        'INSERT OR REPLACE INTO ticket_cache (id, payload, synced_at) VALUES (?, ?, ?)',
        [t.id, JSON.stringify(t), now],
      );
    }
  });
  log.info({ count: tickets.length }, 'mobile.tickets.cache_upserted');
}
