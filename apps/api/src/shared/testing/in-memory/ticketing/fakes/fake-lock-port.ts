import { LockPort, LockUnavailableError } from '../../../../../shared/locking/lock.port';

/**
 * LockPort de prueba. Por defecto pasa el trabajo directo (sin exclusión real:
 * los tests son secuenciales). `unavailable()` simula un recurso ocupado para
 * verificar la traducción a StockLockedError (doble barrera anti-sobreventa).
 */
export class FakeLockPort extends LockPort {
  private available = true;

  /** Claves sobre las que se pidió el lock, en orden. */
  readonly keys: string[] = [];

  /** Simula que el lock no se puede adquirir (recurso ocupado). */
  unavailable(): this {
    this.available = false;
    return this;
  }

  /** Restaura el comportamiento pass-through (lock disponible). */
  availableAgain(): this {
    this.available = true;
    return this;
  }

  async withLock<T>(key: string, _ttlMs: number, work: () => Promise<T>): Promise<T> {
    this.keys.push(key);
    if (!this.available) throw new LockUnavailableError();
    return work();
  }
}
