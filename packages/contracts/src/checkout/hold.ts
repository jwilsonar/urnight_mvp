import { z } from 'zod';

export const createTicketHoldSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
  /** Reemplazo atómico al cambiar tipo o cantidad en el checkout. */
  replaceHoldId: z.string().uuid().optional(),
});
export type CreateTicketHoldDto = z.infer<typeof createTicketHoldSchema>;

export const ticketHoldStatusSchema = z.enum([
  'active',
  'converted',
  'expired',
  'released',
]);

export const ticketHoldResponseSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  quantity: z.number().int().positive(),
  status: ticketHoldStatusSchema,
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type TicketHoldResponse = z.infer<typeof ticketHoldResponseSchema>;
