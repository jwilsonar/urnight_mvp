import type { EventTenantPort } from '../../../modules/events/domain/ports/event-tenant.port';
import type { ResourceTenantResolver } from '../../tenant/resource-tenant.port';
import type { TenantScope } from '../../tenant/tenant-scope';

/** Scope de prueba: super_admin (salta el check de aislamiento tenant). */
export const SUPER_ADMIN_SCOPE: TenantScope = { isSuperAdmin: true, companyId: null };

/** Scope de prueba para una empresa concreta. */
export const scopeForCompany = (companyId: string): TenantScope => ({
  isSuperAdmin: false,
  companyId,
});

/** EventTenantPort de prueba: devuelve un companyId fijo para cualquier local/evento. */
export class FakeEventTenant implements EventTenantPort {
  constructor(private readonly companyId: string | null = null) {}
  async companyIdForLocal(): Promise<string | null> {
    return this.companyId;
  }
  async companyIdForEvent(): Promise<string | null> {
    return this.companyId;
  }
}

/** ResourceTenantResolver de prueba: companyId fijo para cualquier recurso. */
export class FakeResourceTenant implements ResourceTenantResolver {
  constructor(private readonly companyId: string | null = null) {}
  async companyIdForLocal(): Promise<string | null> {
    return this.companyId;
  }
  async companyIdForEvent(): Promise<string | null> {
    return this.companyId;
  }
  async companyIdForTicketType(): Promise<string | null> {
    return this.companyId;
  }
}
