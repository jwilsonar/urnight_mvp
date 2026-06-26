import { z } from 'zod';

/** Postular para ser promotor (público / usuario). */
export const applyPromoterSchema = z.object({
  localId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  contactEmail: z.string().email().max(160).optional(),
  contactPhone: z.string().trim().min(6).max(20).optional(),
  socials: z.string().max(512).optional(),
});
export type ApplyPromoterDto = z.infer<typeof applyPromoterSchema>;

export const reviewPromoterApplicationSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  // Solo super_admin puede fijar la empresa; admin_local la toma de su token
  // (aislamiento tenant — nunca se acepta una empresa ajena desde el body).
  companyId: z.string().uuid().optional(),
});
export type ReviewPromoterApplicationDto = z.infer<typeof reviewPromoterApplicationSchema>;

export const promoterApplicationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdPromoterId: z.string().uuid().nullable(),
  createdAt: z.string(),
});
export type PromoterApplicationResponse = z.infer<typeof promoterApplicationResponseSchema>;
