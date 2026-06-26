import { z } from 'zod';

const slug = z
  .string()
  .min(2)
  .max(180)
  .regex(/^[a-z0-9-]+$/, 'slug debe ser kebab-case');

/** Crear local (LOCAL §4.1, multi-tenant por company_id). */
export const createLocalSchema = z.object({
  companyId: z.string().uuid(),
  zoneId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  slug,
  description: z.string().max(5000).optional(),
  address: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  googleMapsUrl: z.string().url().max(512).optional(),
  socials: z.string().max(512).optional(),
  mainImageUrl: z.string().url().max(512).optional(),
});
export type CreateLocalDto = z.infer<typeof createLocalSchema>;

export const suspendLocalSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});
export type SuspendLocalDto = z.infer<typeof suspendLocalSchema>;

/** Filtros de búsqueda pública de locales (#3: texto, zona, tipo, género, tag). */
export const localListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  zoneId: z.string().uuid().optional(),
  localTypeId: z.string().uuid().optional(),
  genreId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
});
export type LocalListQuery = z.infer<typeof localListQuerySchema>;

export const localResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  zoneId: z.string().uuid().nullable(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  mainImageUrl: z.string().nullable(),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']),
  isVerified: z.boolean(),
  createdAt: z.string(),
});
export type LocalResponse = z.infer<typeof localResponseSchema>;

export const localListResponseSchema = z.array(localResponseSchema);
export type LocalListResponse = z.infer<typeof localListResponseSchema>;
