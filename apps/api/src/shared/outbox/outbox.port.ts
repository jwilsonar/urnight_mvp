/** Job a encolar (email, PDF, push, atribución). */
export interface OutboxJob<T = unknown> {
  readonly queue: string;
  readonly name: string;
  readonly data: T;
}

/**
 * Puerto OUT del patrón Outbox (§3.2). El caso de uso persiste el job en la
 * MISMA Tx (pasando `tx`) → entrega fiable. Sin `tx`, se inserta con la conexión
 * por defecto (flujos no transaccionales). El relay (worker) drena la tabla a
 * BullMQ.
 */
export abstract class OutboxPort {
  abstract enqueue<T>(job: OutboxJob<T>, tx?: unknown): Promise<void>;
}
