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
  createdAt: z.string(),
});
export type VerificationResponse = z.infer<typeof verificationResponseSchema>;
