import { z } from 'zod';

/** Solicitar verificación de un local (ITSE / licencia municipal). */
export const requestVerificationSchema = z.object({
  licenseReference: z.string().max(120).optional(),
  documentUrl: z.string().url().max(512).optional(),
  notes: z.string().max(500).optional(),
  validUntil: z.string().date().optional(),
});
export type RequestVerificationDto = z.infer<typeof requestVerificationSchema>;

/** Revisión por super_admin. */
export const reviewVerificationSchema = z.object({
  decision: z.enum(['approved', 'observed', 'expired']),
  notes: z.string().max(500).optional(),
});
export type ReviewVerificationDto = z.infer<typeof reviewVerificationSchema>;

export const verificationResponseSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'observed', 'expired']),
  licenseReference: z.string().nullable(),
  validUntil: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type VerificationResponse = z.infer<typeof verificationResponseSchema>;

export const LOCAL_DOCUMENT_TYPES = [
  'municipal_license',
  'itse_certificate',
  'health_certificate',
  'other',
] as const;
export const localDocumentTypeSchema = z.enum(LOCAL_DOCUMENT_TYPES);
export type LocalDocumentType = z.infer<typeof localDocumentTypeSchema>;

export const localDocumentReviewStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type LocalDocumentReviewStatus = z.infer<typeof localDocumentReviewStatusSchema>;

export const localDocumentLifecycleStatusSchema = z.enum([
  'valid',
  'expiring_soon',
  'expired',
  'pending',
  'rejected',
]);
export type LocalDocumentLifecycleStatus = z.infer<
  typeof localDocumentLifecycleStatusSchema
>;

export const confirmLocalVerificationDocumentSchema = z
  .object({
    key: z.string().min(1).max(512),
    documentType: localDocumentTypeSchema,
    issuedAt: z.string().date(),
    expiresAt: z.string().date(),
  })
  .refine((value) => value.expiresAt > value.issuedAt, {
    path: ['expiresAt'],
    message: 'La fecha de vencimiento debe ser posterior a la fecha de emisión.',
  });
export type ConfirmLocalVerificationDocumentDto = z.infer<
  typeof confirmLocalVerificationDocumentSchema
>;

export const reviewLocalVerificationDocumentSchema = z
  .object({
    decision: z.enum(['approved', 'rejected']),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === 'rejected' && !value.notes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notes'],
        message: 'Indica el motivo del rechazo.',
      });
    }
  });
export type ReviewLocalVerificationDocumentDto = z.infer<
  typeof reviewLocalVerificationDocumentSchema
>;

export const localVerificationDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  verificationId: z.string().uuid(),
  localId: z.string().uuid(),
  localName: z.string(),
  companyId: z.string().uuid(),
  documentType: localDocumentTypeSchema,
  issuedAt: z.string(),
  expiresAt: z.string(),
  reviewStatus: localDocumentReviewStatusSchema,
  lifecycleStatus: localDocumentLifecycleStatusSchema,
  reviewNotes: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  downloadUrl: z.string().url().nullable(),
  createdAt: z.string(),
});
export type LocalVerificationDocumentResponse = z.infer<
  typeof localVerificationDocumentResponseSchema
>;

export const localVerificationDocumentListResponseSchema = z.array(
  localVerificationDocumentResponseSchema,
);
export type LocalVerificationDocumentListResponse = z.infer<
  typeof localVerificationDocumentListResponseSchema
>;

export const verificationPolicyResponseSchema = z.object({
  requiredDocumentTypes: z.array(localDocumentTypeSchema),
  expiryWarningDays: z.number().int().positive(),
});
export type VerificationPolicyResponse = z.infer<typeof verificationPolicyResponseSchema>;
