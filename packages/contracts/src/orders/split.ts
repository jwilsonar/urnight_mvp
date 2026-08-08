import { z } from 'zod';

const splitMoneySchema = z.number().positive().max(99_999_999.99).multipleOf(0.01);

export const registerLocalOrderSplitPaymentSchema = z.object({
  payerName: z.string().trim().min(1).max(120),
  amount: splitMoneySchema,
});
export type RegisterLocalOrderSplitPaymentDto = z.infer<
  typeof registerLocalOrderSplitPaymentSchema
>;

export const localOrderSplitPaymentResponseSchema = z.object({
  id: z.string().uuid(),
  payerName: z.string(),
  amount: splitMoneySchema,
  paidAt: z.string(),
});
export type LocalOrderSplitPaymentResponse = z.infer<
  typeof localOrderSplitPaymentResponseSchema
>;

export const localOrderSplitResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  shareToken: z.string(),
  expectedTotal: splitMoneySchema,
  paidTotal: z.number().nonnegative().multipleOf(0.01),
  remainingAmount: z.number().nonnegative().multipleOf(0.01),
  isPaid: z.boolean(),
  payments: z.array(localOrderSplitPaymentResponseSchema),
  createdAt: z.string(),
});
export type LocalOrderSplitResponse = z.infer<typeof localOrderSplitResponseSchema>;
