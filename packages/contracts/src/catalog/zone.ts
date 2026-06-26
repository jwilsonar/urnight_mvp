import { z } from 'zod';

const slug = z
  .string()
  .min(2)
  .max(140)
  .regex(/^[a-z0-9-]+$/, 'slug debe ser kebab-case');

/** Crear zona (Taxonomy & Catalogs §4.1). */
export const createZoneSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type CreateZoneDto = z.infer<typeof createZoneSchema>;

/** Actualización parcial. */
export const updateZoneSchema = createZoneSchema.partial();
export type UpdateZoneDto = z.infer<typeof updateZoneSchema>;

/** Zona como la devuelve la API (camelCase, fechas ISO). */
export const zoneResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ZoneResponse = z.infer<typeof zoneResponseSchema>;

export const zoneListResponseSchema = z.array(zoneResponseSchema);
export type ZoneListResponse = z.infer<typeof zoneListResponseSchema>;
