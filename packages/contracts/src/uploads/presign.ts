import { z } from 'zod';
import {
  documentContentTypeSchema,
  imageContentTypeSchema,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  uploadScopeSchema,
} from './image';

/**
 * Solicitud de URL firmada de subida. El servidor firma un PUT a `tmp/{uuid}.ext`
 * (staging, sin tenant). La autorización multi-tenant ocurre en el confirm del
 * módulo dueño. La URL expira corto y queda bindeada al contentType.
 */
export const presignRequestSchema = z
  .object({
    scope: uploadScopeSchema,
    contentType: documentContentTypeSchema,
    sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
  })
  .superRefine((value, ctx) => {
    if (
      value.scope !== 'verificationDocument' &&
      !imageContentTypeSchema.safeParse(value.contentType).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contentType'],
        message: 'Este tipo de subida solo acepta imágenes.',
      });
    }
    if (value.scope !== 'verificationDocument' && value.sizeBytes > MAX_IMAGE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: MAX_IMAGE_BYTES,
        inclusive: true,
        type: 'number',
        path: ['sizeBytes'],
        message: 'La imagen supera el tamaño máximo permitido.',
      });
    }
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
