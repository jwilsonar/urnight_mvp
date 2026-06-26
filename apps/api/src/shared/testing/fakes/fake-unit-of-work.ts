import type { UnitOfWork } from '../../unit-of-work/unit-of-work';

/**
 * UnitOfWork de prueba: ejecuta el trabajo sin transacción real (pasa `undefined`
 * como `tx`). Los repos en memoria ignoran el `tx`. Se castea porque el tipo `Tx`
 * es específico de Drizzle y el dominio no lo conoce (seam neutral).
 */
export function fakeUnitOfWork(): UnitOfWork {
  return {
    run: async <T>(work: (tx: unknown) => Promise<T>): Promise<T> => work(undefined),
  } as unknown as UnitOfWork;
}
