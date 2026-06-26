import { z } from 'zod';

/**
 * Invitar/crear promotor (admin_local). El `companyId` lo deriva el backend del
 * actor (no se envía). El promotor se identifica por `email`: queda en estado
 * `pending` hasta que esa persona confirme la asociación desde su panel. NO se
 * piden UUIDs de usuario; el `localId` se elige con un selector en el front.
 */
export const createPromoterSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(160),
  localId: z.string().uuid().optional(),
  contactPhone: z.string().trim().min(6).max(20).optional(),
});
export type CreatePromoterDto = z.infer<typeof createPromoterSchema>;

/** Estados del promotor (incluye `pending`: invitado, aún sin confirmar). */
export const promoterStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending']);
export type PromoterStatusValue = z.infer<typeof promoterStatusSchema>;

export const referralLinkResponseSchema = z.object({
  code: z.string(),
  url: z.string(),
  clicks: z.number().int(),
  isActive: z.boolean(),
});
export type ReferralLinkResponse = z.infer<typeof referralLinkResponseSchema>;

export const promoterResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  localId: z.string().uuid().nullable(),
  userId: z.string().uuid().nullable(),
  name: z.string(),
  status: promoterStatusSchema,
  invitedEmail: z.string().nullable(),
  referralLink: referralLinkResponseSchema.nullable(),
  createdAt: z.string(),
});
export type PromoterResponse = z.infer<typeof promoterResponseSchema>;

/**
 * Vista que ve la persona invitada en su panel: solicitudes de asociación a una
 * empresa que debe aceptar o rechazar. No expone el link de referido (aún no
 * existe hasta confirmar).
 */
export const promoterAssociationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  companyId: z.string().uuid(),
  localId: z.string().uuid().nullable(),
  status: promoterStatusSchema,
  invitedEmail: z.string().nullable(),
  createdAt: z.string(),
});
export type PromoterAssociationResponse = z.infer<typeof promoterAssociationResponseSchema>;

export const promoterSalesResponseSchema = z.object({
  promoterId: z.string().uuid(),
  totalAttributions: z.number().int(),
  totalCommission: z.number(),
  attributions: z.array(
    z.object({
      orderId: z.string().uuid(),
      commissionAmount: z.number(),
      status: z.enum(['estimated', 'confirmed', 'void']),
      attributedAt: z.string(),
    }),
  ),
});
export type PromoterSalesResponse = z.infer<typeof promoterSalesResponseSchema>;
