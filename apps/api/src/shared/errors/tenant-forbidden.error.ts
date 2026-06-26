import { DomainError } from './domain-error';

/**
 * Acción o lectura sobre recursos de otra empresa (aislamiento multi-tenant,
 * §4.1 / invariantes). Reutilizable por cualquier módulo — DRY. Mensaje único.
 */
export class TenantForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = 'auth/tenant-forbidden';
  constructor() {
    super('No puedes operar sobre recursos de otra empresa.');
  }
}
