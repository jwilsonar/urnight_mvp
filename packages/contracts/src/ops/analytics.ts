import { z } from 'zod';

/** Ingesta de evento de analítica (sin PII sensible). */
export const recordAnalyticsSchema = z.object({
  eventName: z.string().trim().min(2).max(60),
  sessionId: z.string().max(80).optional(),
  eventId: z.string().uuid().optional(),
  localId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});
export type RecordAnalyticsDto = z.infer<typeof recordAnalyticsSchema>;

export const analyticsAckSchema = z.object({ recorded: z.boolean() });
export type AnalyticsAck = z.infer<typeof analyticsAckSchema>;
