import { z } from 'zod';
import { adultBirthDateSchema, documentNumberSchema } from '../common/rules';
import { documentTypeSchema } from '../identity/auth';

/** Asistente de una entrada (18+ obligatorio §4.3). */
export const attendeeInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  documentType: documentTypeSchema,
  documentNumber: documentNumberSchema,
  birthDate: adultBirthDateSchema,
  isBuyer: z.boolean().default(false),
});
export type AttendeeInput = z.infer<typeof attendeeInputSchema>;

/** Línea de compra: un tipo de entrada + sus asistentes (cantidad = nº asistentes). */
export const orderItemInputSchema = z.object({
  ticketTypeId: z.string().uuid(),
  /** Hold creado al entrar al checkout. Opcional para clientes antiguos. */
  holdId: z.string().uuid().optional(),
  attendees: z.array(attendeeInputSchema).min(1).max(10),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

/** Crear orden + pagar en un paso (checkout §4.1). */
export const createOrderSchema = z
  .object({
    eventId: z.string().uuid(),
    items: z.array(orderItemInputSchema).min(1).max(20),
    method: z.enum(['card', 'yape', 'plin']),
    promoCode: z.string().trim().min(3).max(40).optional(),
    referralCode: z.string().trim().min(4).max(12).optional(),
  })
  // M2: no se permiten dos líneas con el mismo `ticketTypeId` (agrupar los
  // asistentes en una sola línea). Evita que items duplicados pasen la
  // re-verificación de stock y revienten el CHECK sold<=stock con un 500.
  .superRefine((val, ctx) => {
    const seen = new Set<string>();
    val.items.forEach((item, index) => {
      if (seen.has(item.ticketTypeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'ticketTypeId'],
          message:
            'Tipo de entrada repetido: agrupa todos los asistentes de un mismo tipo en una sola línea.',
        });
      }
      seen.add(item.ticketTypeId);
    });
  });
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const orderItemResponseSchema = z.object({
  id: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int(),
  unitPrice: z.number(),
  lineTotal: z.number(),
});
export type OrderItemResponse = z.infer<typeof orderItemResponseSchema>;

export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  orderCode: z.string(),
  eventId: z.string().uuid(),
  subtotal: z.number(),
  discountTotal: z.number(),
  commissionAmount: z.number(),
  total: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'paid', 'failed', 'cancelled', 'refunded']),
  items: z.array(orderItemResponseSchema),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
});
export type OrderResponse = z.infer<typeof orderResponseSchema>;
