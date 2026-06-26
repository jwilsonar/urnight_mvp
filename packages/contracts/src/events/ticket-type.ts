import { z } from 'zod';

/** Crear tipo de entrada (TICKET_TYPE §4.1). */
export const createTicketTypeSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  tierCode: z.enum(['general', 'vip', 'premium']).default('general'),
  price: z.number().nonnegative().max(100000),
  currency: z.string().length(3).default('PEN'),
  stock: z.number().int().positive(),
  maxPerUser: z.number().int().positive().optional(),
  saleStartsAt: z.string().datetime().optional(),
  saleEndsAt: z.string().datetime().optional(),
});
export type CreateTicketTypeDto = z.infer<typeof createTicketTypeSchema>;

export const ticketTypeResponseSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  name: z.string(),
  tierCode: z.enum(['general', 'vip', 'premium']),
  price: z.number(),
  currency: z.string(),
  stock: z.number().int(),
  sold: z.number().int(),
  remaining: z.number().int(),
  maxPerUser: z.number().int().nullable(),
  status: z.enum(['active', 'paused', 'sold_out']),
});
export type TicketTypeResponse = z.infer<typeof ticketTypeResponseSchema>;

export const ticketTypeListResponseSchema = z.array(ticketTypeResponseSchema);
export type TicketTypeListResponse = z.infer<typeof ticketTypeListResponseSchema>;
