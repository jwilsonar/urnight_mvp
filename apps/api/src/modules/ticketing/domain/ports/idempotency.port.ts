/**
 * Puerto OUT de idempotencia de checkout (M3). Deduplica reintentos del mismo
 * usuario con la misma `Idempotency-Key`: guarda `key → orderId` para devolver
 * la orden ya creada en vez de crear otra (y cobrar dos veces). La
 * implementación (Redis) vive en infraestructura; el TTL acota el ciclo de vida.
 */
export interface IdempotencyStore {
  /** Devuelve el `orderId` ya asociado a la clave (por usuario) o `null`. */
  recall(userId: string, key: string): Promise<string | null>;
  /** Asocia `key → orderId` (best-effort, con TTL). */
  remember(userId: string, key: string, orderId: string): Promise<void>;
}

export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');
