import type { Event } from '../entities/event.entity';

/** Filtros de listado público de eventos (#3). Fechas ya parseadas a Date. */
export interface EventListFilter {
  localId?: string;
  zoneId?: string;
  genreId?: string;
  tagId?: string;
  q?: string;
  from?: Date;
  to?: Date;
  /** Paginación opcional (ausentes ⇒ lista completa, retrocompatible). */
  limit?: number;
  offset?: number;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  existsBySlug(slug: string): Promise<boolean>;
  /** Eventos públicos (status=published) con filtros de búsqueda (#3). */
  listPublished(filter?: EventListFilter): Promise<Event[]>;
  /** Eventos más populares (tickets vendidos), para tendencia (#9). */
  listTrending(limit: number): Promise<Event[]>;
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

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');
