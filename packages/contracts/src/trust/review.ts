import { z } from 'zod';

/** Crear reseña (solo comprador asistente verificado §invariantes). */
export const createReviewSchema = z
  .object({
    targetType: z.enum(['local', 'event']),
    localId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    ticketId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
    quickTags: z.array(z.string().max(40)).max(10).optional(),
  })
  .refine((v) => (v.targetType === 'local' ? !!v.localId : !!v.eventId), {
    message: 'Debe enviar localId para target local o eventId para target event',
  });
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export const reviewResponseSchema = z.object({
  id: z.string().uuid(),
  targetType: z.enum(['local', 'event']),
  localId: z.string().uuid().nullable(),
  eventId: z.string().uuid().nullable(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  isVerified: z.boolean(),
  status: z.enum(['published', 'hidden']),
  createdAt: z.string(),
});
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

export const reviewListResponseSchema = z.array(reviewResponseSchema);
export type ReviewListResponse = z.infer<typeof reviewListResponseSchema>;
