import { describe, expect, it } from 'vitest';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import { FakeOrdersPaymentPort } from '../../../../shared/testing/fakes/fake-orders-payment.port';
import { InMemoryLocalOrderRepository } from '../../../../shared/testing/in-memory/orders';
import { LocalOrder, LocalOrderItem } from '../../domain/entities/local-order.entity';
import { LocalOrderAlreadyPaidError } from '../../domain/errors/orders.errors';
import { PayLocalOrderUseCase } from './pay-local-order.use-case';

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
    paymentMethod: 'card',
    totalAmount: 35,
    currency: 'PEN',
    items: [
      LocalOrderItem.create({
        id: '44444444-4444-4444-4444-444444444444',
        productId: '55555555-5555-5555-5555-555555555555',
        quantity: 1,
        unitAmount: 35,
        lineAmount: 35,
      }),
    ],
    createdAt: now,
    updatedAt: now,
  });
}

describe('PayLocalOrderUseCase', () => {
  it('usa el puerto de pago y deja el pedido pagado', async () => {
    const orders = new InMemoryLocalOrderRepository();
    const payment = new FakeOrdersPaymentPort();
    orders.seed(order());
    const useCase = new PayLocalOrderUseCase(orders, payment, fakeUnitOfWork());

    const paid = await useCase.execute({
      orderId: ORDER_ID,
      userId: USER_ID,
      dto: { method: 'wallet' },
      now: new Date('2026-08-04T06:05:00.000Z'),
    });

    expect(paid.paymentStatus).toBe('paid');
    expect(paid.paymentMethod).toBe('wallet');
    expect(payment.charges).toHaveLength(1);
  });

  it('rechaza volver a pagar un pedido pagado', async () => {
    const orders = new InMemoryLocalOrderRepository();
    const existing = order();
    existing.markPaid('card');
    orders.seed(existing);
    const useCase = new PayLocalOrderUseCase(
      orders,
      new FakeOrdersPaymentPort(),
      fakeUnitOfWork(),
    );

    await expect(
      useCase.execute({
        orderId: ORDER_ID,
        userId: USER_ID,
        dto: { method: 'card' },
      }),
    ).rejects.toBeInstanceOf(LocalOrderAlreadyPaidError);
  });
});
