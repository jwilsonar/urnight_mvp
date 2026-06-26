import { z } from 'zod';

export const ticketResponseSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  qrCode: z.string(),
  /** Key S3 del PNG del QR. Null si aún no se generó (fallback: render en cliente). */
  qrImageKey: z.string().nullable(),
  status: z.enum(['valid', 'used', 'cancelled', 'expired']),
  issuedAt: z.string(),
  attendeeName: z.string(),
  /**
   * Detalle del evento. Lo rellena la billetera (/tickets/me); en la respuesta
   * de checkout va null (la página de éxito ya conoce el evento por contexto).
   */
  eventName: z.string().nullable(),
  eventStartsAt: z.string().nullable(),
  eventFlyerKey: z.string().nullable(),
  venueName: z.string().nullable(),
  ticketTypeName: z.string().nullable(),
});
export type TicketResponse = z.infer<typeof ticketResponseSchema>;

export const ticketListResponseSchema = z.array(ticketResponseSchema);
export type TicketListResponse = z.infer<typeof ticketListResponseSchema>;
