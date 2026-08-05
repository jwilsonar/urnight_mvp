import type { CreateOrderDto } from '@urnight/contracts';
import { getDb } from './local-db';
import type { CheckoutDraft, DraftStatus } from './checkout-draft-rules';

interface DraftRow {
  event_id: string;
  idempotency_key: string;
  dto: string;
  status: string;
  created_at: string;
}

/** Se llama solo cuando la orden ya está confirmada. */
export async function clearDraft(eventId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM checkout_draft WHERE event_id = ?', [eventId]);
}

/** Borrador vivo de un evento, si lo hay. */
export async function readDraft(eventId: string): Promise<CheckoutDraft | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DraftRow>(
    'SELECT event_id, idempotency_key, dto, status, created_at FROM checkout_draft WHERE event_id = ?',
    [eventId],
  );
  if (!row) return null;
  try {
    return {
      eventId: row.event_id,
      idempotencyKey: row.idempotency_key,
      dto: JSON.parse(row.dto) as CreateOrderDto,
      status: row.status as DraftStatus,
      createdAt: row.created_at,
    };
  } catch {
    // Fila corrupta: se descarta para no bloquear una compra nueva.
    await clearDraft(eventId);
    return null;
  }
}

/** Persiste el borrador ANTES de enviar: es lo que sobrevive a que el sistema mate la app. */
export async function saveDraft(draft: CheckoutDraft): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO checkout_draft
       (event_id, idempotency_key, dto, status, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      draft.eventId,
      draft.idempotencyKey,
      JSON.stringify(draft.dto),
      draft.status,
      draft.createdAt,
    ],
  );
}
