import { z } from "zod";

/**
 * Zona operativa del MVP. Cálculo y presentación de hora punta deben compartirla.
 * TODO: reemplazarla por el timezone persistido de cada local.
 */
export const PROMOTER_ANALYTICS_TIME_ZONE = "America/Lima";

const analyticsDateSchema = z.string().datetime({ offset: true });

export const promoterMetricsQuerySchema = z
  .object({
    eventId: z.string().uuid().optional(),
    from: analyticsDateSchema.optional(),
    to: analyticsDateSchema.optional(),
  })
  .refine(
    (value) =>
      !value.from ||
      !value.to ||
      new Date(value.from).getTime() <= new Date(value.to).getTime(),
    {
      path: ["to"],
      message: "to debe ser posterior o igual a from",
    },
  );
export type PromoterMetricsQuery = z.infer<typeof promoterMetricsQuerySchema>;

export const promoterRankingQuerySchema = promoterMetricsQuerySchema.and(
  z.object({
    sortBy: z.enum(["sales", "attendance", "attendance_rate"]).default("sales"),
    order: z.enum(["asc", "desc"]).default("desc"),
  }),
);
export type PromoterRankingQuery = z.infer<typeof promoterRankingQuerySchema>;

export const promoterMoneyMetricSchema = z.object({
  currency: z.string().min(3).max(3),
  grossAmount: z.number(),
  commissionAmount: z.number(),
});
export type PromoterMoneyMetricResponse = z.infer<
  typeof promoterMoneyMetricSchema
>;

export const promoterMetricTotalsSchema = z.object({
  allocatedCount: z.number().int().nonnegative(),
  invitedCount: z.number().int().nonnegative(),
  redeemedCount: z.number().int().nonnegative(),
  redemptionRate: z.number().min(0).max(100),
  attendedCount: z.number().int().nonnegative(),
  attendanceRate: z.number().min(0).max(100),
  firstEntryAt: z.string().nullable(),
  lastEntryAt: z.string().nullable(),
  peakEntryHourAt: z.string().nullable(),
  companionsCount: z.number().int().nonnegative(),
  companionOrdersKnown: z.number().int().nonnegative(),
  companionOrdersUnknown: z.number().int().nonnegative(),
  /** Órdenes pagadas atribuidas, deduplicadas por order_id. */
  salesCount: z.number().int().nonnegative(),
  attributedOrdersCount: z.number().int().nonnegative(),
  salesByCurrency: z.array(promoterMoneyMetricSchema),
  commissionPendingCount: z.number().int().nonnegative(),
  conflictingOrdersExcluded: z.number().int().nonnegative(),
});
export type PromoterMetricTotalsResponse = z.infer<
  typeof promoterMetricTotalsSchema
>;

export const promoterAttributedSaleSchema = z.object({
  orderId: z.string().uuid(),
  code: z.string().nullable(),
  source: z.enum(["promo_code", "referral", "promo_and_referral"]),
  ticketCount: z.number().int().nonnegative(),
  amount: z.number(),
  currency: z.string().min(3).max(3),
  commissionAmount: z.number().nullable(),
  attributedAt: z.string(),
});
export type PromoterAttributedSaleResponse = z.infer<
  typeof promoterAttributedSaleSchema
>;

export const promoterEventMetricsSchema = promoterMetricTotalsSchema.extend({
  eventId: z.string().uuid(),
  eventName: z.string(),
  eventStartsAt: z.string(),
  eventStatus: z.enum([
    "draft",
    "scheduled",
    "published",
    "cancelled",
    "finished",
  ]),
  excludedReason: z.enum(["event_cancelled"]).nullable(),
  sales: z.array(promoterAttributedSaleSchema),
});
export type PromoterEventMetricsResponse = z.infer<
  typeof promoterEventMetricsSchema
>;

export const promoterMetricsResponseSchema = z.object({
  promoterId: z.string().uuid(),
  promoterName: z.string(),
  companyId: z.string().uuid(),
  totals: promoterMetricTotalsSchema,
  events: z.array(promoterEventMetricsSchema),
  conflicts: z.array(
    z.object({
      orderId: z.string().uuid(),
      eventId: z.string().uuid(),
      eventName: z.string(),
      amount: z.number(),
      currency: z.string().min(3).max(3),
      promoterIds: z.array(z.string().uuid()).min(2),
    }),
  ),
});
export type PromoterMetricsResponse = z.infer<
  typeof promoterMetricsResponseSchema
>;

export const promoterRankingRowSchema = z.object({
  promoterId: z.string().uuid(),
  promoterName: z.string(),
  companyId: z.string().uuid(),
  eligibleForRateRanking: z.boolean(),
  totals: promoterMetricTotalsSchema,
});
export type PromoterRankingRowResponse = z.infer<
  typeof promoterRankingRowSchema
>;

export const promoterRankingResponseSchema = z.object({
  minimumVolume: z.number().int().positive(),
  conflictingOrdersExcluded: z.number().int().nonnegative(),
  conflicts: promoterMetricsResponseSchema.shape.conflicts,
  rows: z.array(promoterRankingRowSchema),
});
export type PromoterRankingResponse = z.infer<
  typeof promoterRankingResponseSchema
>;
