import type { Event } from "../entities/event.entity";
import type { TrendingConfig } from "../services/trending-score";

/**
 * Punto de extensión del catálogo: hoy el producto exige vencimiento cercano.
 * Un recomendador futuro podrá añadir otra estrategia sin cambiar la firma del listado.
 */
export type EventCatalogOrder = "soonest";

/** Filtros de listado público de eventos (#3). Fechas ya parseadas a Date. */
export interface EventListFilter {
  localId?: string;
  zoneId?: string;
  genreIds?: string[];
  tagIds?: string[];
  q?: string;
  from?: Date;
  to?: Date;
  /** Coincide si al menos un tipo de entrada tiene precio dentro del rango inclusivo. */
  minPrice?: number;
  maxPrice?: number;
  /** Paginación opcional (ausentes ⇒ lista completa, retrocompatible). */
  limit?: number;
  offset?: number;
  order?: EventCatalogOrder;
  /** Corte compartido entre datos y conteo para que la paginación sea consistente. */
  availableAt?: Date;
}

/** Proyección de catálogo: aggregate + relevancia calculada por persistencia. */
export interface EventListItem {
  event: Event;
  matchScore: number;
  matchesAll: boolean;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  existsBySlug(slug: string): Promise<boolean>;
  /** Eventos públicos, futuros, con cupo y filtros de búsqueda (#3). */
  listPublished(filter?: EventListFilter): Promise<EventListItem[]>;
  /** Total exacto con los mismos filtros, ignorando limit/offset. */
  countPublished(filter?: EventListFilter): Promise<number>;
  /** Eventos futuros ordenados por velocidad, cercanía e intensidad (#9). */
  listTrending(
    limit: number,
    config: TrendingConfig,
    availableAt?: Date,
  ): Promise<Event[]>;
  /** Próximos eventos publicados (startsAt >= ahora), recomendados/calendario (#10/#18). */
  listUpcoming(limit: number): Promise<Event[]>;
  /** Lectura admin: TODOS los eventos de un local (cualquier estado). */
  listByLocal(localId: string): Promise<Event[]>;
  create(event: Event): Promise<Event>;
  update(event: Event): Promise<Event>;
  /** Reemplaza el set de categorías/géneros del evento (borra + inserta). */
  setGenres(eventId: string, genreIds: string[]): Promise<void>;
  /** Reemplaza el set de etiquetas del evento (borra + inserta). */
  setTags(eventId: string, tagIds: string[]): Promise<void>;
}

export const EVENT_REPOSITORY = Symbol("EVENT_REPOSITORY");
