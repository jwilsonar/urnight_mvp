import { TenantForbiddenError } from '../../../shared/errors/tenant-forbidden.error';
import type { ResourceTenantResolver } from '../../../shared/tenant/resource-tenant.port';
import {
  assertTenant,
  scopedCompanyId,
  type TenantScope,
} from '../../../shared/tenant/tenant-scope';
import { OrdersLocalNotFoundError } from '../domain/errors/orders.errors';

/** Valida el local del pedido con el scope efectivo del panel. */
export async function assertOrdersLocalTenant(
  localId: string,
  scope: TenantScope,
  tenant: ResourceTenantResolver,
): Promise<string | null> {
  const companyId = scopedCompanyId(scope);
  if (companyId === undefined) throw new TenantForbiddenError();
  const ownerCompanyId = await tenant.companyIdForLocal(localId);
  if (!ownerCompanyId) throw new OrdersLocalNotFoundError();
  assertTenant(scope, ownerCompanyId);
  return companyId;
}
