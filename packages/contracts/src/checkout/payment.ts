import { z } from 'zod';

/** Pagar una orden (MVP: MockPaymentAdapter). */
export const payOrderSchema = z.object({
  method: z.enum(['card', 'yape', 'plin']),
});
export type PayOrderDto = z.infer<typeof payOrderSchema>;

export const paymentResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  gateway: z.enum(['culqi', 'izipay', 'mock']),
  method: z.enum(['card', 'yape', 'plin']),
  status: z.enum(['pending', 'approved', 'rejected']),
  amount: z.number(),
  gatewayReference: z.string().nullable(),
  failureReason: z.string().nullable(),
});
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
