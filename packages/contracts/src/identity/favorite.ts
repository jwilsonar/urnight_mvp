import { z } from 'zod';

/** Tipos de target de un favorito (polimórfico, §4.3). */
export const FAVORITE_TARGET_TYPES = ['local', 'event'] as const;
export type FavoriteTargetType = (typeof FAVORITE_TARGET_TYPES)[number];

/** Alta de favorito: exactamente un target (local | event). */
export const addFavoriteSchema = z.object({
  targetType: z.enum(FAVORITE_TARGET_TYPES),
  targetId: z.string().uuid(),
});
export type AddFavoriteDto = z.infer<typeof addFavoriteSchema>;

/**
 * Detalle del local/evento apuntado por un favorito, resuelto cross-módulo para
 * la vista Guardados (nombre, slug, portada). `startsAt`/`status` solo aplican a
 * eventos. `imageUrl` ya viene resuelta a URL pública (StoragePort).
 */
export const favoriteTargetSchema = z.object({
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  startsAt: z.string().nullable(),
  status: z.string().nullable(),
});
export type FavoriteTarget = z.infer<typeof favoriteTargetSchema>;

/** Favorito como lo devuelve la API. */
export const favoriteResponseSchema = z.object({
  id: z.string().uuid(),
  targetType: z.enum(FAVORITE_TARGET_TYPES),
  targetId: z.string().uuid(),
  createdAt: z.string(),
  /** Datos del target; null al crear (POST) o si el target ya no existe. */
  target: favoriteTargetSchema.nullable().default(null),
});
export type FavoriteResponse = z.infer<typeof favoriteResponseSchema>;
