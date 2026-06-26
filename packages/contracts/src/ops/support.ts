import { z } from 'zod';

/** Abrir ticket de soporte interno. */
export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().max(5000).optional(),
  category: z.enum(['incident', 'request', 'bug']).default('request'),
  priority: z.enum(['low', 'medium', 'high']).default('low'),
  localId: z.string().uuid().optional(),
});
export type CreateSupportTicketDto = z.infer<typeof createSupportTicketSchema>;

export const resolveSupportTicketSchema = z.object({
  status: z.enum(['in_progress', 'resolved', 'closed']),
});
export type ResolveSupportTicketDto = z.infer<typeof resolveSupportTicketSchema>;

export const supportTicketResponseSchema = z.object({
  id: z.string().uuid(),
  ticketCode: z.string(),
  subject: z.string(),
  category: z.enum(['incident', 'request', 'bug']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high']),
  createdAt: z.string(),
});
export type SupportTicketResponse = z.infer<typeof supportTicketResponseSchema>;
