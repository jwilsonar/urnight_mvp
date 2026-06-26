import type {
  CancelEventDto,
  CompanyResponse,
  CreateCompanyDto,
  CreateEventDto,
  CreateLocalDto,
  CreateTicketTypeDto,
  EventListResponse,
  EventResponse,
  LocalListResponse,
  LocalResponse,
  LocalStatsResponse,
  RequestVerificationDto,
  SuspendLocalDto,
  TicketTypeListResponse,
  TicketTypeResponse,
  UpdateEventDto,
  VerificationResponse,
} from '@urnight/contracts';
import { apiFetch } from './client';

/**
 * Fetchers y mutaciones del panel de administración local.
 *
 * Notas sobre el backend (gaps cubiertos aquí):
 * - No existe `GET /locals/:id`: el detalle por id se obtiene listando
 *   (`GET /locals`) y filtrando en memoria. `GET /locals/:slug` resolvería por
 *   slug, no por id, así que no es utilizable desde rutas `[id]`.
 * - No existe `GET /events/:id`: lo mismo aplica para eventos; se resuelve
 *   listando (`GET /events`) y filtrando por id.
 * - No existe un listado de empresas: `POST /companies` es solo super_admin y
 *   el backend ata el local a la empresa del actor (`actorCompanyId`). El
 *   formulario de local pide el `companyId` explícitamente.
 */

// ── Reads (Server Components: token desde getSession) ────────────────────────

/** Catálogo público (todas las empresas, solo activos). NO para el panel admin. */
export function listLocals(token: string, zoneId?: string) {
  return apiFetch<LocalListResponse>('/locals', { token, query: { zoneId } });
}

/**
 * Locales de MI empresa (todos los estados). Aislado por tenant en el backend
 * (`GET /locals/mine`): nunca devuelve locales de otra empresa.
 */
export function listMyLocals(token: string) {
  return apiFetch<LocalListResponse>('/locals/mine', { token });
}

/** Detalle de un local de MI empresa por id (filtra sobre la lista scoped). */
export async function getLocalById(token: string, id: string): Promise<LocalResponse | null> {
  const locals = await listMyLocals(token);
  return locals.find((local) => local.id === id) ?? null;
}

/** Eventos de un local de MI empresa (todos los estados). Aislado por tenant. */
export function listMyEvents(token: string, localId: string) {
  return apiFetch<EventListResponse>('/events/mine', { token, query: { localId } });
}

/** KPIs agregados de un local (GET /events/stats/:localId, #19/#22). */
export function getLocalStats(token: string, localId: string) {
  return apiFetch<LocalStatsResponse>(`/events/stats/${localId}`, { token });
}

/** Detalle admin de un evento de MI empresa por id (`GET /events/manage/:id`). */
export async function getEventById(token: string, id: string): Promise<EventResponse | null> {
  try {
    return await apiFetch<EventResponse>(`/events/manage/${id}`, { token });
  } catch {
    return null; // 403/404 → no es de mi empresa o no existe
  }
}

export function listTicketTypes(token: string, eventId: string) {
  return apiFetch<TicketTypeListResponse>(`/events/${eventId}/ticket-types`, { token });
}

// ── Mutations (Client Components: token desde useSession) ─────────────────────

export function createCompany(dto: CreateCompanyDto, token: string) {
  return apiFetch<CompanyResponse>('/companies', { method: 'POST', json: dto, token });
}

export function createLocal(dto: CreateLocalDto, token: string) {
  return apiFetch<LocalResponse>('/locals', { method: 'POST', json: dto, token });
}

export function publishLocal(id: string, token: string) {
  return apiFetch<LocalResponse>(`/locals/${id}/publish`, { method: 'POST', token });
}

export function suspendLocal(id: string, dto: SuspendLocalDto, token: string) {
  return apiFetch<LocalResponse>(`/locals/${id}/suspend`, { method: 'POST', json: dto, token });
}

export function requestLocalVerification(id: string, dto: RequestVerificationDto, token: string) {
  return apiFetch<VerificationResponse>(`/locals/${id}/verifications`, {
    method: 'POST',
    json: dto,
    token,
  });
}

export function createEvent(dto: CreateEventDto, token: string) {
  return apiFetch<EventResponse>('/events', { method: 'POST', json: dto, token });
}

/** Edita un evento de MI empresa (datos + flyer vía `flyerKey` de staging). */
export function updateEvent(id: string, dto: UpdateEventDto, token: string) {
  return apiFetch<EventResponse>(`/events/${id}`, { method: 'PATCH', json: dto, token });
}

export function publishEvent(id: string, token: string) {
  return apiFetch<EventResponse>(`/events/${id}/publish`, { method: 'POST', token });
}

export function cancelEvent(id: string, dto: CancelEventDto, token: string) {
  return apiFetch<EventResponse>(`/events/${id}/cancel`, { method: 'POST', json: dto, token });
}

export function createTicketType(dto: CreateTicketTypeDto, token: string) {
  return apiFetch<TicketTypeResponse>('/ticket-types', { method: 'POST', json: dto, token });
}
