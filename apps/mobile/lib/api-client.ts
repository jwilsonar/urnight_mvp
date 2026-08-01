import Constants from 'expo-constants';
import type {
  EventListResponse,
  EventResponse,
  LocalListResponse,
  TicketTypeListResponse,
  ZoneResponse,
} from '@urnight/contracts';
import { createLogger } from './logger';

/**
 * Resuelve la URL base del API (§6). En dispositivo físico `localhost` apunta al
 * teléfono, no a la máquina de desarrollo: se deriva la IP del host de Metro
 * (`hostUri`) y se asume el puerto del API local (3101, ADR-0001).
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:3101/api/v1` : 'http://localhost:3101/api/v1';
}

const API_URL = resolveApiUrl();
const log = createLogger('api');

export interface HealthResponse {
  status: string;
  info: Record<string, { status: string }>;
}

type QueryParams = Record<string, string | number | undefined>;

/** Serializa la query omitiendo valores ausentes (espejo de `apps/web/lib/api/client.ts`). */
function withQuery(path: string, query?: QueryParams): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** GET tipado con log de fallo de red (§6). */
async function getJson<T>(path: string, event: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) {
      log.warn({ path, status: res.status }, `${event}.error`);
    }
    return (await res.json()) as T;
  } catch (err) {
    log.error({ path, err: (err as Error).message }, `${event}.network_error`);
    throw err;
  }
}

/** Cliente tipado hacia el API (tipos compartidos §5). */
export function fetchHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>('/health', 'mobile.api.health');
}

export function fetchZones(): Promise<ZoneResponse[]> {
  return getJson<ZoneResponse[]>('/zones', 'mobile.api.zones');
}

/** Filtros públicos del listado (espejo de `EventListParams` de la web). */
export interface EventListParams {
  q?: string;
  localId?: string;
  zoneId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export function fetchEvents(params?: EventListParams): Promise<EventListResponse> {
  return getJson<EventListResponse>(
    withQuery('/events', params as QueryParams | undefined),
    'mobile.api.events',
  );
}

/** Próximos eventos (GET /events/upcoming, mismo endpoint que la home web). */
export function fetchUpcomingEvents(): Promise<EventListResponse> {
  return getJson<EventListResponse>('/events/upcoming', 'mobile.api.events_upcoming');
}

export function fetchEventBySlug(slug: string): Promise<EventResponse> {
  return getJson<EventResponse>(
    `/events/${encodeURIComponent(slug)}`,
    'mobile.api.event_detail',
  );
}

export function fetchEventTicketTypes(eventId: string): Promise<TicketTypeListResponse> {
  return getJson<TicketTypeListResponse>(
    `/events/${encodeURIComponent(eventId)}/ticket-types`,
    'mobile.api.ticket_types',
  );
}

export function fetchLocals(): Promise<LocalListResponse> {
  return getJson<LocalListResponse>('/locals', 'mobile.api.locals');
}
