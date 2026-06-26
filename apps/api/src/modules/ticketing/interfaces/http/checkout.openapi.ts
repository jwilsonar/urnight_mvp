import {
  createOrderSchema,
  orderResponseSchema,
  qrValidationResponseSchema,
  ticketListResponseSchema,
  ticketResponseSchema,
  validateQrSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });

/** Definiciones OpenAPI del bounded context Checkout, Payments & Tickets. */
export function registerCheckoutDocs(): void {
  const CreateOrder = registry.register('CreateOrderDto', createOrderSchema);
  const OrderR = registry.register('OrderResponse', orderResponseSchema);
  registry.register('TicketResponse', ticketResponseSchema);
  const ValidateQr = registry.register('ValidateQrDto', validateQrSchema);
  const QrResult = registry.register('QrValidationResponse', qrValidationResponseSchema);
  const CheckoutResponse = registry.register(
    'CheckoutResponse',
    z.object({ order: orderResponseSchema, tickets: ticketListResponseSchema }),
  );

  registry.registerPath({
    method: 'post',
    path: '/orders/checkout',
    tags: ['Checkout'],
    summary: 'Comprar entradas (reserva stock + pago mock + emite tickets)',
    security: bearer,
    request: { body: json(CreateOrder) },
    responses: {
      201: { description: 'Orden pagada + entradas', ...json(CheckoutResponse) },
      402: problem('Pago rechazado'),
      409: problem('Sin stock / evento no a la venta / recurso ocupado'),
      422: problem('Asistente menor de edad / validación'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/orders/{id}',
    tags: ['Checkout'],
    summary: 'Detalle de orden propia',
    security: bearer,
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: 'Orden', ...json(OrderR) },
      404: problem('No encontrada'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/tickets/me',
    tags: ['Checkout'],
    summary: 'Billetera: mis entradas',
    security: bearer,
    responses: { 200: { description: 'Entradas', ...json(ticketListResponseSchema) } },
  });

  registry.registerPath({
    method: 'post',
    path: '/validations/scan',
    tags: ['Checkout'],
    summary: 'Validar QR en puerta (validator)',
    security: bearer,
    request: { body: json(ValidateQr) },
    responses: { 200: { description: 'Resultado de validación', ...json(QrResult) } },
  });
}
