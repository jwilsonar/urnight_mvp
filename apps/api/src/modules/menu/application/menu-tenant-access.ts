import { TenantForbiddenError } from '../../../shared/errors/tenant-forbidden.error';
import type { ResourceTenantResolver } from '../../../shared/tenant/resource-tenant.port';
import {
  assertTenant,
  scopedCompanyId,
  type TenantScope,
} from '../../../shared/tenant/tenant-scope';
import { MenuLocalNotFoundError } from '../domain/errors/menu.errors';

/** Valida el local y devuelve el filtro de empresa efectivo para persistencia. */
export async function assertMenuLocalTenant(
  localId: string,
  scope: TenantScope,
  tenant: ResourceTenantResolver,
): Promise<string | null> {
  const companyId = scopedCompanyId(scope);
  if (companyId === undefined) throw new TenantForbiddenError();

  const ownerCompanyId = await tenant.companyIdForLocal(localId);
  if (!ownerCompanyId) throw new MenuLocalNotFoundError();
  assertTenant(scope, ownerCompanyId);
  return companyId;
}
