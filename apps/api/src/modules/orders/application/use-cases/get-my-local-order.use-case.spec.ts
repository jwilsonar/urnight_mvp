import { describe, expect, it } from 'vitest';
import { InMemoryLocalOrderRepository } from '../../../../shared/testing/in-memory/orders';
import { LocalOrder } from '../../domain/entities/local-order.entity';
import { LocalOrderNotFoundError } from '../../domain/errors/orders.errors';
import { GetMyLocalOrderUseCase } from './get-my-local-order.use-case';

const ORDER_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

function order(): LocalOrder {
  const now = new Date('2026-08-04T06:00:00.000Z');
  return LocalOrder.create({
    id: ORDER_ID,
    localId: '33333333-3333-3333-3333-333333333333',
    userId: USER_ID,
    attendeeName: 'Andrea',
    pickupCode: 'ABC234',
    pickupZone: 'Barra norte',
    paymentMethod: 'wallet',
    totalAmount: 35,
    currency: 'PEN',
    items: [],
    createdAt: now,
    updatedAt: now,
  });
}

describe('GetMyLocalOrderUseCase', () => {
  it('devuelve el pedido del asistente autenticado', async () => {
    const orders = new InMemoryLocalOrderRepository();
    orders.seed(order());
    const useCase = new GetMyLocalOrderUseCase(orders);

    const result = await useCase.execute({ orderId: ORDER_ID, userId: USER_ID });

    expect(result.id).toBe(ORDER_ID);
  });

  it('no expone el pedido a otro usuario', async () => {
    const orders = new InMemoryLocalOrderRepository();
    orders.seed(order());
    const useCase = new GetMyLocalOrderUseCase(orders);

    await expect(
      useCase.execute({
        orderId: ORDER_ID,
        userId: '44444444-4444-4444-4444-444444444444',
      }),
    ).rejects.toBeInstanceOf(LocalOrderNotFoundError);
  });
});
