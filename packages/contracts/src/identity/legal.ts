import { z } from 'zod';

/** Tipos de documento legal (§4.1 LegalDocType). varchar+CHECK. */
export const LEGAL_DOC_TYPES = ['terms', 'privacy', 'refund_policy'] as const;
export const legalDocTypeSchema = z.enum(LEGAL_DOC_TYPES);
export type LegalDocType = z.infer<typeof legalDocTypeSchema>;

/** Publicar una nueva versión de documento legal (pasa a is_current). */
export const publishLegalDocumentSchema = z.object({
  docType: legalDocTypeSchema,
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, 'versión semántica, p.ej. 1.0 o 1.2.3'),
  contentUrl: z.string().url(),
});
export type PublishLegalDocumentDto = z.infer<typeof publishLegalDocumentSchema>;

/** Aceptación de un documento legal por el usuario. */
export const acceptLegalDocumentSchema = z.object({
  legalDocumentId: z.string().uuid(),
});
export type AcceptLegalDocumentDto = z.infer<typeof acceptLegalDocumentSchema>;

/** Documento legal como lo devuelve la API. */
export const legalDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  docType: legalDocTypeSchema,
  version: z.string(),
  contentUrl: z.string(),
  isCurrent: z.boolean(),
  publishedAt: z.string(),
});
export type LegalDocumentResponse = z.infer<typeof legalDocumentResponseSchema>;

/** Constancia de aceptación legal. */
export const legalAcceptanceResponseSchema = z.object({
  id: z.string().uuid(),
  legalDocumentId: z.string().uuid(),
  versionAccepted: z.string(),
  acceptedAt: z.string(),
});
export type LegalAcceptanceResponse = z.infer<typeof legalAcceptanceResponseSchema>;
