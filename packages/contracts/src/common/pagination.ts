import { z } from 'zod';

/**
 * Paginación reutilizable (SOLID/DRY §13): un único esquema para todos los
 * listados. Soporta paginación por offset (page/limit) y por cursor opaco.
 * Los valores llegan como query strings → z.coerce para los numéricos.
 *
 * NOTA: esquema listo para reutilizar; los endpoints se migran por separado.
 */
export const paginationQuerySchema = z.object({
  /** Página 1-indexada (paginación por offset). */
  page: z.coerce.number().int().min(1).default(1),
  /** Tamaño de página; acotado para evitar respuestas gigantes. */
  limit: z.coerce.number().int().min(1).max(100).default(20),
  /** Cursor opaco (paginación por keyset); mutuamente excluyente con page. */
  cursor: z.string().min(1).max(512).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Envoltorio genérico de un listado paginado. `items` + metadatos de página.
 * `nextCursor` sólo se rellena en la variante por cursor (null/undefined si no
 * hay más). Reutilizable en cualquier respuesta de listado.
 */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextCursor?: string | null;
}
