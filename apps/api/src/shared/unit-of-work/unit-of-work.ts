import type { Database } from '@urnight/db';

/** Transacción Drizzle (mismo tipo que `db` dentro de `.transaction`). */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Puerto Unit of Work — transaccionalidad por caso de uso (§3.2).
 * commit/rollback atómico: si `work` lanza, la Tx hace rollback.
 * La implementación (Drizzle) vive en infraestructura (`DrizzleUnitOfWork`),
 * coherente con el resto del shared kernel (LockPort/OutboxPort). El único
 * acoplamiento a Drizzle es el tipo `Tx` (type-only, se borra en compilación).
 */
export abstract class UnitOfWork {
  abstract run<T>(work: (tx: Tx) => Promise<T>): Promise<T>;
}
