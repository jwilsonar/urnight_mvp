/**
 * Resolutor de aislamiento multi-tenant compartido (Shared Kernel). Traduce la
 * referencia de un recurso a la empresa dueña, recorriendo las FK hacia
 * `local.company_id`. Lo usan módulos cuyo recurso no lleva company_id directo
 * (promo-codes, reports). DRY: un único punto de resolución por join.
 */
export interface ResourceTenantResolver {
  /** companyId del local, o null si no existe. */
  companyIdForLocal(localId: string): Promise<string | null>;
  /** companyId del local del evento, o null si no existe. */
  companyIdForEvent(eventId: string): Promise<string | null>;
  /** companyId vía ticket_type → event → local, o null si no existe. */
  companyIdForTicketType(ticketTypeId: string): Promise<string | null>;
}

export const RESOURCE_TENANT_RESOLVER = Symbol('RESOURCE_TENANT_RESOLVER');
