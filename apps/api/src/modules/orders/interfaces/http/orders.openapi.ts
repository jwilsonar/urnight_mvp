import {
  advanceLocalOrderStatusSchema,
  createLocalOrderSchema,
  localOrderListResponseSchema,
  localOrderResponseSchema,
  localOrderSplitResponseSchema,
  payLocalOrderSchema,
  registerLocalOrderSplitPaymentSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });
const localParams = z.object({ localId: z.string().uuid() });
const orderParams = z.object({ orderId: z.string().uuid() });
const localOrderParams = localParams.extend({ orderId: z.string().uuid() });
const splitParams = z.object({ shareToken: z.string().min(1).max(64) });

export function registerOrdersDocs(): void {
  const Order = registry.register('LocalOrderResponse', localOrderResponseSchema);
  const Split = registry.register('LocalOrderSplitResponse', localOrderSplitResponseSchema);
  const CreateOrder = registry.register('CreateLocalOrderDto', createLocalOrderSchema);
  const AdvanceStatus = registry.register(
    'AdvanceLocalOrderStatusDto',
    advanceLocalOrderStatusSchema,
  );
  const PayOrder = registry.register('PayLocalOrderDto', payLocalOrderSchema);
  const RegisterSplitPayment = registry.register(
    'RegisterLocalOrderSplitPaymentDto',
    registerLocalOrderSplitPaymentSchema,
  );

  registry.registerPath({
    method: 'post',
    path: '/locals/{localId}/orders',
    tags: ['Orders in venue'],
    summary: 'Crear pedido dentro del local',
    security: bearer,
    request: { params: localParams, body: json(CreateOrder) },
    responses: {
      201: { description: 'Pedido creado', ...json(Order) },
      409: problem('Horario cerrado o producto no disponible'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/locals/{localId}/orders/queue',
    tags: ['Orders in venue'],
    summary: 'Listar cola abierta del local',
    security: bearer,
    request: { params: localParams },
    responses: {
      200: { description: 'Cola de barra', ...json(localOrderListResponseSchema) },
      403: problem('Tenant no permitido'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/locals/{localId}/orders/{orderId}/status',
    tags: ['Orders in venue'],
    summary: 'Avanzar estado del pedido (staff)',
    security: bearer,
    request: { params: localOrderParams, body: json(AdvanceStatus) },
    responses: {
      200: { description: 'Estado actualizado', ...json(Order) },
      403: problem('Solo staff o super_admin'),
      409: problem('Transición inválida'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/local-orders/{orderId}',
    tags: ['Orders in venue'],
    summary: 'Consultar mi pedido',
    security: bearer,
    request: { params: orderParams },
    responses: {
      200: { description: 'Pedido del asistente', ...json(Order) },
      404: problem('Pedido no encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/local-orders/{orderId}/pay',
    tags: ['Orders in venue'],
    summary: 'Pagar pedido',
    security: bearer,
    request: { params: orderParams, body: json(PayOrder) },
    responses: {
      200: { description: 'Pedido pagado', ...json(Order) },
      409: problem('Pedido ya pagado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/local-orders/{orderId}/split',
    tags: ['Orders in venue'],
    summary: 'Crear enlace para dividir la cuenta',
    security: bearer,
    request: { params: orderParams },
    responses: {
      201: { description: 'Split creado', ...json(Split) },
      404: problem('Pedido no encontrado'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/local-order-splits/{shareToken}',
    tags: ['Orders in venue'],
    summary: 'Consultar cuenta dividida por token (público)',
    request: { params: splitParams },
    responses: {
      200: { description: 'Estado del split', ...json(Split) },
      404: problem('Split no encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/local-order-splits/{shareToken}/payments',
    tags: ['Orders in venue'],
    summary: 'Registrar pago parcial por token (público)',
    request: { params: splitParams, body: json(RegisterSplitPayment) },
    responses: {
      201: { description: 'Pago parcial registrado', ...json(Split) },
      409: problem('El pago excede el saldo pendiente'),
    },
  });
}
