import { DomainError } from '../errors/domain-error';

/** Lanzado cuando no se adquiere el lock (recurso ocupado). */
export class LockUnavailableError extends DomainError {
  readonly status = 409;
  readonly code = 'common/lock-unavailable';
  constructor() {
    super('Recurso ocupado, intenta de nuevo.');
  }
}

/**
 * Puerto de lock distribuido (§3.2). Doble barrera anti-sobreventa junto al
 * CHECK de Postgres. La implementación (Redis) vive en infraestructura.
 */
export abstract class LockPort {
  /** Ejecuta `work` en exclusión mutua sobre `key`; lanza LockUnavailableError si no adquiere. */
  abstract withLock<T>(key: string, ttlMs: number, work: () => Promise<T>): Promise<T>;
}
