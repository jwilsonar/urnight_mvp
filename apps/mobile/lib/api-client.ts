import Constants from 'expo-constants';
import {
  problemDetailsSchema,
  type AuthTokensResponse,
  type EventListResponse,
  type EventResponse,
  type LocalListResponse,
  type LoginDto,
  type ProblemDetails,
  type TicketTypeListResponse,
  type UserProfileResponse,
  type ZoneResponse,
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

/**
 * Error HTTP del API en formato RFC 7807 (espejo de `ApiError` de
 * `apps/web/lib/api/client.ts`): expone status, `code` de dominio
 * (p. ej. `identity/invalid-credentials`) y errores por campo.
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

const REQUEST_TIMEOUT_MS = 15_000;

interface RequestOptions {
  method?: 'GET' | 'POST';
  json?: unknown;
  token?: string;
}

/**
 * Petición tipada que SÍ lanza en no-2xx (a diferencia de `getJson`), parseando
 * problem+json como la web. Timeout manual con AbortController (Hermes no trae
 * `AbortSignal.timeout`).
 */
async function request<T>(path: string, event: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      let problem: Partial<ProblemDetails> | undefined;
      try {
        problem = problemDetailsSchema.partial().parse(await res.json());
      } catch {
        problem = undefined;
      }
      log.warn({ path, status: res.status, code: problem?.code }, `${event}.error`);
      throw new ApiError(res.status, problem);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (!(err instanceof ApiError)) {
      log.error({ path, err: (err as Error).message }, `${event}.network_error`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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

// --- Identidad (SD-02/SD-03, espejo de apps/web/lib/api/auth/requests.ts) ---

export function loginRequest(input: LoginDto): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/auth/login', 'mobile.api.auth_login', {
    method: 'POST',
    json: input,
  });
}

export function refreshRequest(refreshToken: string): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/auth/refresh', 'mobile.api.auth_refresh', {
    method: 'POST',
    json: { refreshToken },
  });
}

/** Revoca el refresh token en servidor (204). El móvil SÍ llama logout (§90 SD-02). */
export function logoutRequest(refreshToken: string): Promise<void> {
  return request<void>('/auth/logout', 'mobile.api.auth_logout', {
    method: 'POST',
    json: { refreshToken },
  });
}

export function fetchMe(accessToken: string): Promise<UserProfileResponse> {
  return request<UserProfileResponse>('/auth/me', 'mobile.api.auth_me', {
    token: accessToken,
  });
}
