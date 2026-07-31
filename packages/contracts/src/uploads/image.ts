import { z } from 'zod';

/**
 * Reglas de imágenes — fuente única compartida entre cliente (validación del
 * dropzone) y servidor (presign + confirm). Cualquier cambio aquí aplica a
 * ambos lados sin drift (§5 Zod compartido).
 */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];
export const ACCEPTED_DOCUMENT_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf'] as const;
export type AcceptedDocumentType = (typeof ACCEPTED_DOCUMENT_TYPES)[number];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/** Extensión de fichero canónica por mime aceptado (para la key de S3). */
export const IMAGE_EXTENSION_BY_TYPE: Record<AcceptedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
export const DOCUMENT_EXTENSION_BY_TYPE: Record<AcceptedDocumentType, string> = {
  ...IMAGE_EXTENSION_BY_TYPE,
  'application/pdf': 'pdf',
};

export const imageContentTypeSchema = z.enum(ACCEPTED_IMAGE_TYPES);
export const documentContentTypeSchema = z.enum(ACCEPTED_DOCUMENT_TYPES);

/** Ámbito del recurso destino — define el prefijo final de la key tras confirmar. */
export const uploadScopeSchema = z.enum(['local', 'event', 'avatar', 'verificationDocument']);
export type UploadScope = z.infer<typeof uploadScopeSchema>;
