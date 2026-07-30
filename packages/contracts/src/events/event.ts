import { z } from "zod";

const slug = z
  .string()
  .min(2)
  .max(200)
  .regex(/^[a-z0-9-]+$/, "slug debe ser kebab-case");

/** Crear evento (EVENT §4.1). */
export const createEventSchema = z.object({
  localId: z.string().uuid(),
  name: z.string().trim().min(2).max(180),
  slug,
  description: z.string().max(8000).optional(),
  startsAt: z.string().datetime({ message: "startsAt debe ser ISO 8601" }),
  endsAt: z.string().datetime().optional(),
  flyerUrl: z.string().url().max(512).optional(),
  /**
   * Flyer subido a staging (key `tmp/…` del presign). El servidor la valida y
   * promueve a `events/{id}/` tras crear. Tiene prioridad sobre `flyerUrl`
   * (que se mantiene para seeds/clientes API con imágenes externas).
   */
  flyerKey: z.string().max(512).optional(),
  totalCapacity: z.number().int().min(0).default(0),
  minAgeNote: z.string().max(40).optional(),
  dressCode: z.string().max(120).optional(),
});
export type CreateEventDto = z.infer<typeof createEventSchema>;

export const cancelEventSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});
export type CancelEventDto = z.infer<typeof cancelEventSchema>;

/**
 * Editar evento (admin_local dueño). Todos los campos son opcionales: se aplica
 * lo presente (PATCH). El slug no se edita (es el permalink público). Para
 * reemplazar el flyer se envía `flyerKey` (key de staging tmp/) recién subida;
 * el servidor la promueve a `events/{id}/` y la persiste en `flyerUrl`.
 */
export const updateEventSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  description: z.string().max(8000).nullable().optional(),
  startsAt: z
    .string()
    .datetime({ message: "startsAt debe ser ISO 8601" })
    .optional(),
  endsAt: z.string().datetime().nullable().optional(),
  totalCapacity: z.number().int().min(0).optional(),
  minAgeNote: z.string().max(40).optional(),
  dressCode: z.string().max(120).nullable().optional(),
  flyerKey: z.string().max(512).optional(),
  /** Categorías/géneros musicales del evento. Si se envía, reemplaza el set actual. */
  genreIds: z.array(z.string().uuid()).max(20).optional(),
  /** Etiquetas del catálogo (superadmin). Si se envía, reemplaza el set actual. */
  tagIds: z.array(z.string().uuid()).max(30).optional(),
  /**
   * Etiquetas libres del evento (no del catálogo), guardadas como JSON en el
   * evento. Permiten crear muchas etiquetas únicas por evento. Si se envía,
   * reemplaza el set actual.
   */
  customTags: z.array(z.string().trim().min(1).max(40)).max(50).optional(),
});
export type UpdateEventDto = z.infer<typeof updateEventSchema>;

/** Filtros de búsqueda pública (#3: texto, zona, género, tag, fechas y precio). */
const optionalPriceSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.number().int().nonnegative().optional(),
);

export const eventListQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    localId: z.string().uuid().optional(),
    zoneId: z.string().uuid().optional(),
    genreId: z.string().uuid().optional(),
    tagId: z.string().uuid().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    minPrice: optionalPriceSchema,
    maxPrice: optionalPriceSchema,
    // Paginación opcional (retrocompatible: ausentes ⇒ lista completa).
    limit: z.coerce.number().int().min(1).max(60).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || maxPrice >= minPrice,
    {
      message: "maxPrice debe ser mayor o igual que minPrice",
      path: ["maxPrice"],
    },
  );
export type EventListQuery = z.infer<typeof eventListQuerySchema>;

export const eventCatalogLabelSchema = z.enum([
  "popular",
  "trending",
  "fewTickets",
]);
export type EventCatalogLabel = z.infer<typeof eventCatalogLabelSchema>;

export const eventResponseSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  flyerUrl: z.string().nullable(),
  totalCapacity: z.number().int(),
  ticketsSold: z.number().int(),
  status: z.enum(["draft", "scheduled", "published", "cancelled", "finished"]),
  minAgeNote: z.string(),
  dressCode: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  /** Ids de categorías/géneros musicales asociados (vacío en listados). */
  genreIds: z.array(z.string()).default([]),
  /** Ids de etiquetas del catálogo asociadas (vacío en listados). */
  tagIds: z.array(z.string()).default([]),
  /** Etiquetas libres del evento (JSON), adicionales al catálogo. */
  customTags: z.array(z.string()).default([]),
  /** Señal editorial/operativa calculada por el backend; nunca por datos simulados del cliente. */
  catalogLabel: eventCatalogLabelSchema.nullable().optional(),
});
export type EventResponse = z.infer<typeof eventResponseSchema>;

export const eventListResponseSchema = z.array(eventResponseSchema);
export type EventListResponse = z.infer<typeof eventListResponseSchema>;

/** KPIs agregados de un local (#19/#22). */
export const localStatsResponseSchema = z.object({
  eventsCount: z.number().int(),
  publishedCount: z.number().int(),
  ticketsSold: z.number().int(),
  checkins: z.number().int(),
});
export type LocalStatsResponse = z.infer<typeof localStatsResponseSchema>;
