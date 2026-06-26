/**
 * Puerto driven para aislamiento multi-tenant del módulo Events. Resuelve la
 * empresa dueña de un local/evento sin acoplar el dominio al esquema de
 * Companies (el adapter lo resuelve por join en infraestructura).
 */
export interface EventTenantPort {
  /** companyId dueño del local, o null si el local no existe. */
  companyIdForLocal(localId: string): Promise<string | null>;
  /** companyId dueño del local del evento, o null si el evento no existe. */
  companyIdForEvent(eventId: string): Promise<string | null>;
}

export const EVENT_TENANT_PORT = Symbol('EVENT_TENANT_PORT');
