import { z } from 'zod';

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
      path: ['to'],
      message: 'to debe ser posterior o igual a from',
    },
  );
export type PromoterMetricsQuery = z.infer<typeof promoterMetricsQuerySchema>;

export const promoterRankingQuerySchema = promoterMetricsQuerySchema.and(
  z.object({
    sortBy: z.enum(['sales', 'attendance', 'attendance_rate']).default('sales'),
    order: z.enum(['asc', 'desc']).default('desc'),
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
  registeredCount: z.number().int().nonnegative(),
  attendedCount: z.number().int().nonnegative(),
  attendanceRate: z.number().min(0).max(100),
  firstEntryAt: z.string().nullable(),
  lastEntryAt: z.string().nullable(),
  peakEntryHourAt: z.string().nullable(),
  companionsCount: z.number().int().nonnegative(),
  companionOrdersKnown: z.number().int().nonnegative(),
  companionOrdersUnknown: z.number().int().nonnegative(),
  /** Entradas emitidas y vigentes de órdenes atribuidas y pagadas. */
  salesCount: z.number().int().nonnegative(),
  attributedOrdersCount: z.number().int().nonnegative(),
  salesByCurrency: z.array(promoterMoneyMetricSchema),
  conflictingOrdersExcluded: z.number().int().nonnegative(),
});
export type PromoterMetricTotalsResponse = z.infer<
  typeof promoterMetricTotalsSchema
>;

export const promoterAttributedSaleSchema = z.object({
  orderId: z.string().uuid(),
  code: z.string().nullable(),
  source: z.enum(['promo_code', 'referral', 'promo_and_referral']),
  ticketCount: z.number().int().nonnegative(),
  amount: z.number(),
  currency: z.string().min(3).max(3),
  commissionAmount: z.number(),
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
    'draft',
    'scheduled',
    'published',
    'cancelled',
    'finished',
  ]),
  excludedReason: z.enum(['event_cancelled']).nullable(),
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
  rows: z.array(promoterRankingRowSchema),
});
export type PromoterRankingResponse = z.infer<
  typeof promoterRankingResponseSchema
>;
