import { z } from 'zod';

/** Reportar un local/evento (target polimórfico). */
export const createReportSchema = z
  .object({
    targetType: z.enum(['local', 'event']),
    localId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    reason: z.enum(['cancelled', 'wrong_price', 'wrong_location', 'unsafe', 'other']),
    comment: z.string().max(2000).optional(),
    severity: z.enum(['low', 'medium', 'high']).default('low'),
  })
  .refine((v) => (v.targetType === 'local' ? !!v.localId : !!v.eventId), {
    message: 'Debe enviar localId para target local o eventId para target event',
  });
export type CreateReportDto = z.infer<typeof createReportSchema>;

export const resolveReportSchema = z.object({
  resolutionNote: z.string().trim().min(3).max(2000),
});
export type ResolveReportDto = z.infer<typeof resolveReportSchema>;

export const reportResponseSchema = z.object({
  id: z.string().uuid(),
  targetType: z.enum(['local', 'event']),
  localId: z.string().uuid().nullable(),
  eventId: z.string().uuid().nullable(),
  reason: z.enum(['cancelled', 'wrong_price', 'wrong_location', 'unsafe', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  status: z.enum(['open', 'reviewed', 'resolved']),
  createdAt: z.string(),
});
export type ReportResponse = z.infer<typeof reportResponseSchema>;
