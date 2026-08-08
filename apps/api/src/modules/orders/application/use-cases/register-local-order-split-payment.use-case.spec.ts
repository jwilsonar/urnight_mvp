import { describe, expect, it } from 'vitest';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import {
  InMemoryLocalOrderRepository,
  InMemoryLocalOrderSplitRepository,
} from '../../../../shared/testing/in-memory/orders';
import { LocalOrder, LocalOrderItem } from '../../domain/entities/local-order.entity';
import { LocalOrderSplit } from '../../domain/entities/local-order-split.entity';
import {
  LocalOrderAlreadyPaidError,
  LocalOrderSplitOverpaidError,
} from '../../domain/errors/orders.errors';
import { RegisterLocalOrderSplitPaymentUseCase } from './register-local-order-split-payment.use-case';

const ORDER_ID = '11111111-1111-1111-1111-111111111111';
const SPLIT_ID = '22222222-2222-2222-2222-222222222222';
const TOKEN = 'token-compartible';

function build() {
  const orders = new InMemoryLocalOrderRepository();
  const splits = new InMemoryLocalOrderSplitRepository();
  const now = new Date('2026-08-04T06:00:00.000Z');
  orders.seed(
    LocalOrder.create({
      id: ORDER_ID,
      localId: '33333333-3333-3333-3333-333333333333',
      userId: '44444444-4444-4444-4444-444444444444',
      attendeeName: 'Andrea',
      pickupCode: 'ABC234',
      pickupZone: 'Barra norte',
      paymentMethod: 'card',
      totalAmount: 70,
      currency: 'PEN',
      items: [
        LocalOrderItem.create({
          id: '55555555-5555-5555-5555-555555555555',
          productId: '66666666-6666-6666-6666-666666666666',
          quantity: 2,
          unitAmount: 35,
          lineAmount: 70,
        }),
      ],
      createdAt: now,
      updatedAt: now,
    }),
  );
  splits.seed(
    LocalOrderSplit.create({
      id: SPLIT_ID,
      orderId: ORDER_ID,
      shareToken: TOKEN,
      expectedTotal: 70,
      createdAt: now,
      updatedAt: now,
    }),
  );
  return {
    orders,
    useCase: new RegisterLocalOrderSplitPaymentUseCase(
      orders,
      splits,
      fakeUnitOfWork(),
    ),
  };
}

describe('RegisterLocalOrderSplitPaymentUseCase', () => {
  it('dos pagos parciales que cubren el total dejan el pedido pagado', async () => {
    const { orders, useCase } = build();

    const first = await useCase.execute({
      shareToken: TOKEN,
      dto: { payerName: 'Andrea', amount: 30 },
      now: new Date('2026-08-04T06:05:00.000Z'),
    });
    const completed = await useCase.execute({
      shareToken: TOKEN,
      dto: { payerName: 'Luis', amount: 40 },
      now: new Date('2026-08-04T06:06:00.000Z'),
    });

    expect(first.paidTotal).toBe(30);
    expect(completed.paidTotal).toBe(70);
    expect(completed.isPaid).toBe(true);
    expect((await orders.findById(ORDER_ID))?.paymentStatus).toBe('paid');
  });

  it('rechaza un pago que supera el saldo pendiente', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute({
        shareToken: TOKEN,
        dto: { payerName: 'Andrea', amount: 71 },
      }),
    ).rejects.toBeInstanceOf(LocalOrderSplitOverpaidError);
  });

  it('rechaza pagos parciales si el pedido ya fue pagado por otra vía', async () => {
    const { orders, useCase } = build();
    const order = await orders.findById(ORDER_ID);
    order?.markPaid('card');

    await expect(
      useCase.execute({
        shareToken: TOKEN,
        dto: { payerName: 'Andrea', amount: 10 },
      }),
    ).rejects.toBeInstanceOf(LocalOrderAlreadyPaidError);
  });
});
