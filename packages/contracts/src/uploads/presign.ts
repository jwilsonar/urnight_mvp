import { z } from 'zod';
import { imageContentTypeSchema, MAX_IMAGE_BYTES, uploadScopeSchema } from './image';

/**
 * Solicitud de URL firmada de subida. El servidor firma un PUT a `tmp/{uuid}.ext`
 * (staging, sin tenant). La autorización multi-tenant ocurre en el confirm del
 * módulo dueño. La URL expira corto y queda bindeada al contentType.
 */
export const presignRequestSchema = z.object({
  scope: uploadScopeSchema,
  contentType: imageContentTypeSchema,
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
});
export type PresignRequestDto = z.infer<typeof presignRequestSchema>;

export const presignResponseSchema = z.object({
  /** URL firmada para el PUT directo a S3 (incluir header Content-Type igual). */
  uploadUrl: z.string().url(),
  /** Key de staging que el cliente devuelve en el confirm. */
  key: z.string().min(1),
  /** Segundos hasta que la URL expira (informativo para el cliente). */
  expiresIn: z.number().int().positive(),
});
export type PresignResponseDto = z.infer<typeof presignResponseSchema>;
