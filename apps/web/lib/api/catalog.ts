import type {
  CreateZoneDto,
  EventListResponse,
  EventResponse,
  LocalImageResponse,
  LocalListResponse,
  LocalResponse,
  TicketTypeListResponse,
  ZoneResponse,
} from '@urnight/contracts';
import { apiFetch } from './client';

/** Fetchers de catálogo público (Server Components, ISR). */

const CATALOG_REVALIDATE = 60;

export function getZones() {
  return apiFetch<ZoneResponse[]>('/zones', { next: { revalidate: 300 } });
}

/** Géneros musicales (GET /music-genres, #7). */
export function getMusicGenres() {
  return apiFetch<ZoneResponse[]>('/music-genres', { next: { revalidate: 300 } });
}

/** Etiquetas (GET /tags, #6). */
export function getTags() {
  return apiFetch<ZoneResponse[]>('/tags', { next: { revalidate: 300 } });
}

/** Crea una zona (POST /zones, #8). super_admin. */
export function createZone(dto: CreateZoneDto, token?: string) {
  return apiFetch<ZoneResponse>('/zones', { method: 'POST', json: dto, token });
}

/** Crea un género musical (POST /music-genres, #7). super_admin. */
export function createMusicGenre(dto: CreateZoneDto, token?: string) {
  return apiFetch<ZoneResponse>('/music-genres', { method: 'POST', json: dto, token });
}

/** Crea una etiqueta (POST /tags, #6). super_admin. */
export function createTag(dto: CreateZoneDto, token?: string) {
  return apiFetch<ZoneResponse>('/tags', { method: 'POST', json: dto, token });
}

export interface LocalListParams {
  q?: string;
  zoneId?: string;
  localTypeId?: string;
  genreId?: string;
  tagId?: string;
}

export function getLocals(params?: LocalListParams) {
  return apiFetch<LocalListResponse>('/locals', {
    query: {
      q: params?.q,
      zoneId: params?.zoneId,
      localTypeId: params?.localTypeId,
      genreId: params?.genreId,
      tagId: params?.tagId,
    },
    next: { revalidate: CATALOG_REVALIDATE },
  });
}

export function getLocalBySlug(slug: string) {
  return apiFetch<LocalResponse>(`/locals/${slug}`, { next: { revalidate: CATALOG_REVALIDATE } });
}

/** Galería pública de un local (GET /locals/:id/images, ordenada por sort_order). */
export function getLocalImages(localId: string) {
  return apiFetch<LocalImageResponse[]>(`/locals/${localId}/images`, {
    next: { revalidate: CATALOG_REVALIDATE },
  });
}

export interface EventListParams {
  q?: string;
  localId?: string;
  zoneId?: string;
  genreId?: string;
  tagId?: string;
  from?: string;
  to?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Paginación opcional (ausentes ⇒ lista completa). */
  limit?: number;
  offset?: number;
}

export function getEvents(params?: EventListParams) {
  return apiFetch<EventListResponse>('/events', {
    query: {
      q: params?.q,
      localId: params?.localId,
      zoneId: params?.zoneId,
      genreId: params?.genreId,
      tagId: params?.tagId,
      from: params?.from,
      to: params?.to,
      minPrice: params?.minPrice,
      maxPrice: params?.maxPrice,
      limit: params?.limit,
      offset: params?.offset,
    },
    next: { revalidate: CATALOG_REVALIDATE },
  });
}

export function getEventBySlug(slug: string) {
  return apiFetch<EventResponse>(`/events/${slug}`, { next: { revalidate: CATALOG_REVALIDATE } });
}

/** Eventos en tendencia (GET /events/trending, #9). */
export function getTrendingEvents() {
  return apiFetch<EventListResponse>('/events/trending', {
    next: { revalidate: CATALOG_REVALIDATE },
  });
}

/** Próximos eventos (GET /events/upcoming, #10 recomendados / #18 calendario). */
export function getUpcomingEvents() {
  return apiFetch<EventListResponse>('/events/upcoming', {
    next: { revalidate: CATALOG_REVALIDATE },
  });
}

export function getEventTicketTypes(eventId: string) {
  return apiFetch<TicketTypeListResponse>(`/events/${eventId}/ticket-types`, {
    next: { revalidate: 30 },
  });
}
