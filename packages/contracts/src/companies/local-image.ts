import { z } from 'zod';

/**
 * Confirmación de subida de imagen de local. El cliente ya subió el binario a
 * la key de staging (`tmp/...`) vía URL firmada; aquí la entrega para que el
 * servidor verifique (HEAD), la mueva a `locals/{id}/` y persista `local_image`.
 */
export const confirmLocalImageSchema = z.object({
  /** Key de staging devuelta por POST /uploads/presign. */
  key: z.string().min(1).max(512),
  /** Marcar como portada (también vuelca a local.main_image_url). */
  isMain: z.boolean().optional().default(false),
  /** Dimensiones medidas en el cliente (opcional, solo metadatos). */
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type ConfirmLocalImageDto = z.infer<typeof confirmLocalImageSchema>;

/** Reordenar la galería: el índice en el array fija `sort_order`. */
export const reorderLocalImagesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type ReorderLocalImagesDto = z.infer<typeof reorderLocalImagesSchema>;

export const localImageResponseSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().uuid(),
  url: z.string(),
  isMain: z.boolean(),
  sortOrder: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  sizeBytes: z.number().nullable(),
  createdAt: z.string(),
});
export type LocalImageResponse = z.infer<typeof localImageResponseSchema>;

export const localImageListResponseSchema = z.array(localImageResponseSchema);
export type LocalImageListResponse = z.infer<typeof localImageListResponseSchema>;
