import { z } from 'zod';

/** Solicitud pública de afiliación (alta de empresa/local). */
export const submitAffiliationSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  ruc: z.string().regex(/^\d{11}$/, 'RUC debe tener 11 dígitos'),
  commercialName: z.string().trim().min(2).max(200),
  zoneId: z.string().uuid().optional(),
  address: z.string().max(255).optional(),
  socials: z.string().max(512).optional(),
  contactName: z.string().max(160).optional(),
  contactEmail: z.string().email().max(160).optional(),
  contactPhone: z.string().trim().min(6).max(20).optional(),
  termsAccepted: z.literal(true),
  legalDeclarationAccepted: z.literal(true),
});
export type SubmitAffiliationDto = z.infer<typeof submitAffiliationSchema>;

/** Revisión por super_admin: aprobar (crea empresa+local) o rechazar. */
export const reviewAffiliationSchema = z
  .object({
    decision: z.enum(['approved', 'rejected']),
    rejectionReason: z.string().max(255).optional(),
  })
  .refine((v) => v.decision !== 'rejected' || !!v.rejectionReason, {
    message: 'rejectionReason requerido al rechazar',
    path: ['rejectionReason'],
  });
export type ReviewAffiliationDto = z.infer<typeof reviewAffiliationSchema>;

export const affiliationResponseSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string(),
  ruc: z.string(),
  commercialName: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  rejectionReason: z.string().nullable(),
  companyId: z.string().uuid().nullable(),
  localId: z.string().uuid().nullable(),
  createdAt: z.string(),
});
export type AffiliationResponse = z.infer<typeof affiliationResponseSchema>;
