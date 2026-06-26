import { z } from 'zod';

/**
 * Asignación de un evento a un promotor con descuento + cupo por tipo de entrada.
 * El admin la crea; el `promoterId` va en la URL y el `companyId`/tenant lo deriva
 * el backend. `discountValue` se honra arbitrario, aunque el front lo bloquee a 100
 * (entrada gratis) en el MVP. `allocatedStock` acota cuántos códigos puede generar
 * el promotor para ese tipo.
 */
export const assignEventItemSchema = z.object({
  ticketTypeId: z.string().uuid(),
  discountType: z.enum(['percentage', 'fixed_amount']).default('percentage'),
  discountValue: z.number().positive().max(100000),
  allocatedStock: z.number().int().positive().max(1_000_000),
});
export type AssignEventItemDto = z.infer<typeof assignEventItemSchema>;

export const assignEventSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(assignEventItemSchema).min(1).max(20),
});
export type AssignEventDto = z.infer<typeof assignEventSchema>;

/** Resumen de evento embebido en respuestas de promotor. */
export const promoterEventSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  startsAt: z.string(),
  flyerUrl: z.string().nullable(),
});
export type PromoterEventSummary = z.infer<typeof promoterEventSummarySchema>;

export const assignmentItemResponseSchema = z.object({
  ticketTypeId: z.string().uuid(),
  ticketTypeName: z.string(),
  price: z.number(),
  currency: z.string(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number(),
  allocatedStock: z.number().int(),
  /** Códigos ya generados para este tipo (single-use → 1 por código). */
  usedStock: z.number().int(),
  /** allocatedStock − usedStock. */
  remaining: z.number().int(),
});
export type AssignmentItemResponse = z.infer<typeof assignmentItemResponseSchema>;

export const assignmentResponseSchema = z.object({
  /** id de promoter_event. */
  id: z.string().uuid(),
  promoterId: z.string().uuid(),
  status: z.enum(['active', 'revoked']),
  event: promoterEventSummarySchema,
  items: z.array(assignmentItemResponseSchema),
  createdAt: z.string(),
});
export type AssignmentResponse = z.infer<typeof assignmentResponseSchema>;

/**
 * Generar un código de canje (redemption code) single-use a partir de una
 * asignación + tipo de entrada. Es autogenerado y otorga descuento total (100%)
 * por promotor; distinto del futuro "promo code" manual con valor de descuento.
 */
export const generateRedemptionCodeSchema = z.object({
  promoterEventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
});
export type GenerateRedemptionCodeDto = z.infer<typeof generateRedemptionCodeSchema>;

export const redemptionCodeStatusSchema = z.enum(['active', 'redeemed', 'revoked', 'expired']);
export type RedemptionCodeStatus = z.infer<typeof redemptionCodeStatusSchema>;

/** Código de canje de un promotor (tabla "Gestionar"). */
export const redemptionCodeResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  status: redemptionCodeStatusSchema,
  ticketTypeId: z.string().uuid().nullable(),
  ticketTypeName: z.string().nullable(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number(),
  usageQuota: z.number().int().nullable(),
  usedCount: z.number().int(),
  clicks: z.number().int(),
  /** Enlace corto para compartir: `${origin}/p/<code>`. */
  shareUrl: z.string(),
  createdAt: z.string(),
});
export type RedemptionCodeResponse = z.infer<typeof redemptionCodeResponseSchema>;

/**
 * Payload público de aterrizaje al resolver un código de canje (`/p/<code>` y
 * precarga del checkout). Si `valid=false`, `reason` explica por qué y el resto
 * puede venir nulo.
 */
export const resolveRedemptionCodeResponseSchema = z.object({
  valid: z.boolean(),
  code: z.string(),
  status: redemptionCodeStatusSchema.nullable(),
  reason: z.string().nullable(),
  promoterName: z.string().nullable(),
  discountType: z.enum(['percentage', 'fixed_amount']).nullable(),
  discountValue: z.number().nullable(),
  /** discountType=percentage && discountValue=100. */
  isFree: z.boolean(),
  /** Ahorro total para el comprador (precio del tipo de entrada cubierto). */
  savings: z.number(),
  event: promoterEventSummarySchema.nullable(),
  ticketType: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      price: z.number(),
      currency: z.string(),
    })
    .nullable(),
});
export type ResolveRedemptionCodeResponse = z.infer<typeof resolveRedemptionCodeResponseSchema>;
