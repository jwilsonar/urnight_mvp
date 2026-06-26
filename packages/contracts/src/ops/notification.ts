import { z } from 'zod';

export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  channel: z.enum(['email', 'push']),
  type: z.string(),
  subject: z.string().nullable(),
  status: z.enum(['queued', 'sent', 'failed']),
  createdAt: z.string(),
});
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

export const notificationListResponseSchema = z.array(notificationResponseSchema);
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
