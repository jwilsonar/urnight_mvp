import type { ProblemDetails } from '@urnight/contracts';

/**
 * Error HTTP del API en formato RFC 7807 (espejo de `ApiError` de
 * `apps/web/lib/api/client.ts`): expone status, `code` de dominio
 * (p. ej. `identity/invalid-credentials`) y errores por campo.
 *
 * El servidor respondió: la petición llegó y hay veredicto, así que NO se
 * reintenta.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(status: number, problem?: Partial<ProblemDetails>) {
    super(problem?.detail ?? problem?.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem?.code;
    this.fieldErrors = problem?.errors;
  }
}

/**
 * La petición no llegó a tener respuesta: sin red, timeout o DNS. Es la
 * distinción que gobierna el reintento del checkout (SD-05): un fallo de red se
 * reintenta con la misma clave de idempotencia, una respuesta del servidor no.
 */
export class NetworkError extends Error {
  constructor(message = 'Sin conexión con Ravenue.') {
    super(message);
    this.name = 'NetworkError';
  }
}
