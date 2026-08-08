import { z } from 'zod';

export const localOrderStatusSchema = z.enum([
  'received',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
]);
export type LocalOrderStatus = z.infer<typeof localOrderStatusSchema>;

export const localOrderPaymentMethodSchema = z.enum(['wallet', 'card', 'cash_register']);
export type LocalOrderPaymentMethod = z.infer<typeof localOrderPaymentMethodSchema>;

export const localOrderPaymentStatusSchema = z.enum(['pending', 'paid', 'refunded']);
export type LocalOrderPaymentStatus = z.infer<typeof localOrderPaymentStatusSchema>;

const moneySchema = z.number().positive().max(99_999_999.99).multipleOf(0.01);

export const createLocalOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
});
export type CreateLocalOrderItemDto = z.infer<typeof createLocalOrderItemSchema>;

export const createLocalOrderSchema = z
  .object({
    attendeeName: z.string().trim().min(1).max(120),
    pickupZone: z.string().trim().min(1).max(120),
    paymentMethod: localOrderPaymentMethodSchema,
    items: z.array(createLocalOrderItemSchema).min(1).max(50),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'productId'],
          message: 'Agrupa el mismo producto en una sola línea.',
        });
      }
      seen.add(item.productId);
    });
  });
export type CreateLocalOrderDto = z.infer<typeof createLocalOrderSchema>;

export const advanceLocalOrderStatusSchema = z.object({ status: localOrderStatusSchema });
export type AdvanceLocalOrderStatusDto = z.infer<typeof advanceLocalOrderStatusSchema>;

export const payLocalOrderSchema = z.object({ method: localOrderPaymentMethodSchema });
export type PayLocalOrderDto = z.infer<typeof payLocalOrderSchema>;

export const localOrderItemResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitAmount: moneySchema,
  lineAmount: moneySchema,
});
export type LocalOrderItemResponse = z.infer<typeof localOrderItemResponseSchema>;

export const localOrderResponseSchema = z.object({
  id: z.string().uuid(),
  localId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  attendeeName: z.string(),
  pickupCode: z.string(),
  pickupZone: z.string(),
  status: localOrderStatusSchema,
  paymentMethod: localOrderPaymentMethodSchema,
  paymentStatus: localOrderPaymentStatusSchema,
  totalAmount: moneySchema,
  currency: z.string().length(3),
  items: z.array(localOrderItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  paidAt: z.string().nullable(),
});
export type LocalOrderResponse = z.infer<typeof localOrderResponseSchema>;

export const localOrderListResponseSchema = z.array(localOrderResponseSchema);
export type LocalOrderListResponse = z.infer<typeof localOrderListResponseSchema>;
