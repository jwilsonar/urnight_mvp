import type { TenantScope } from '../../shared/tenant/tenant-scope';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * Deriva el {@link TenantScope} del actor autenticado (JWT). Punto ÚNICO de
 * derivación (DRY): los controllers no repiten `roles.includes('super_admin')`
 * ni `companyId ?? null`.
 */
export function tenantScopeOf(actor: AuthUser): TenantScope {
  return {
    isSuperAdmin: actor.roles.includes('super_admin'),
    companyId: actor.companyId ?? null,
  };
}
