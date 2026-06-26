import { z } from 'zod';

export const PROMO_SCOPES = ['global', 'event', 'local', 'zone', 'promoter', 'ticket_type'] as const;

/** Crear código promocional (§4.1). */
export const createPromoCodeSchema = z.object({
  code: z.string().trim().min(3).max(40).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().positive().max(100000),
  usageQuota: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  scope: z.enum(PROMO_SCOPES).default('global'),
  eventId: z.string().uuid().optional(),
  localId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  promoterId: z.string().uuid().optional(),
  ticketTypeId: z.string().uuid().optional(),
});
export type CreatePromoCodeDto = z.infer<typeof createPromoCodeSchema>;

/** Validar un código contra un contexto de compra (preview de descuento). */
export const validatePromoCodeSchema = z.object({
  code: z.string().trim().min(3).max(40),
  subtotal: z.number().nonnegative(),
  eventId: z.string().uuid().optional(),
  localId: z.string().uuid().optional(),
});
export type ValidatePromoCodeDto = z.infer<typeof validatePromoCodeSchema>;

export const promoCodeResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number(),
  scope: z.enum(PROMO_SCOPES),
  usageQuota: z.number().int().nullable(),
  usedCount: z.number().int(),
  isActive: z.boolean(),
});
export type PromoCodeResponse = z.infer<typeof promoCodeResponseSchema>;

export const promoValidationResponseSchema = z.object({
  valid: z.boolean(),
  discount: z.number(),
  discountType: z.enum(['percentage', 'fixed_amount']).nullable(),
  reason: z.string().nullable(),
});
export type PromoValidationResponse = z.infer<typeof promoValidationResponseSchema>;

/** Canje de un código promocional (#13). */
export const promoRedemptionResponseSchema = z.object({
  id: z.string().uuid(),
  promoCodeId: z.string().uuid(),
  orderId: z.string().uuid(),
  discountApplied: z.number(),
  redeemedAt: z.string(),
});
export type PromoRedemptionResponse = z.infer<typeof promoRedemptionResponseSchema>;
