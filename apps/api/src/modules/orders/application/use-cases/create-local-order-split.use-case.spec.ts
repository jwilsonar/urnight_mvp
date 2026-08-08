import { describe, expect, it } from 'vitest';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import {
  InMemoryLocalOrderRepository,
  InMemoryLocalOrderSplitRepository,
} from '../../../../shared/testing/in-memory/orders';
import { LocalOrder, LocalOrderItem } from '../../domain/entities/local-order.entity';
import { CreateLocalOrderSplitUseCase } from './create-local-order-split.use-case';

const ORDER_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

function seedOrder(orders: InMemoryLocalOrderRepository): void {
  const now = new Date('2026-08-04T06:00:00.000Z');
  orders.seed(
    LocalOrder.create({
      id: ORDER_ID,
      localId: '33333333-3333-3333-3333-333333333333',
      userId: USER_ID,
      attendeeName: 'Andrea',
      pickupCode: 'ABC234',
      pickupZone: 'Barra norte',
      paymentMethod: 'wallet',
      totalAmount: 70,
      currency: 'PEN',
      items: [
        LocalOrderItem.create({
          id: '44444444-4444-4444-4444-444444444444',
          productId: '55555555-5555-5555-5555-555555555555',
          quantity: 2,
          unitAmount: 35,
          lineAmount: 70,
        }),
      ],
      createdAt: now,
      updatedAt: now,
    }),
  );
}

describe('CreateLocalOrderSplitUseCase', () => {
  it('crea un split con token compartible y el total exacto del pedido', async () => {
    const orders = new InMemoryLocalOrderRepository();
    const splits = new InMemoryLocalOrderSplitRepository();
    seedOrder(orders);
    const useCase = new CreateLocalOrderSplitUseCase(orders, splits, fakeUnitOfWork());

    const split = await useCase.execute({ orderId: ORDER_ID, userId: USER_ID });

    expect(split.expectedTotal).toBe(70);
    expect(split.shareToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(split.payments).toEqual([]);
  });
});
