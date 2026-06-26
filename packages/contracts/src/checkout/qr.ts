import { z } from 'zod';

/** Validar QR en puerta (app validador). */
export const validateQrSchema = z.object({
  qrCode: z.string().min(8).max(64),
  localId: z.string().uuid().optional(),
  deviceInfo: z.string().max(255).optional(),
});
export type ValidateQrDto = z.infer<typeof validateQrSchema>;

export const qrValidationResponseSchema = z.object({
  result: z.enum(['valid', 'already_used', 'cancelled', 'invalid']),
  ticketId: z.string().uuid().nullable(),
  attendeeName: z.string().nullable(),
  message: z.string(),
});
export type QrValidationResponse = z.infer<typeof qrValidationResponseSchema>;
