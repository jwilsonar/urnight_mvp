import { describe, expect, it } from 'vitest';
import {
  FakeResourceTenant,
  scopeForCompany,
} from '../../../../shared/testing/fakes';
import { InMemoryLocalOrderRepository } from '../../../../shared/testing/in-memory/orders';
import { LocalOrder, LocalOrderItem } from '../../domain/entities/local-order.entity';
import {
  InvalidOrderStatusTransitionError,
  OrderStatusAdvanceForbiddenError,
} from '../../domain/errors/orders.errors';
import { AdvanceLocalOrderStatusUseCase } from './advance-local-order-status.use-case';

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';
const ORDER_ID = '22222222-2222-2222-2222-222222222222';

function order(): LocalOrder {
  const now = new Date('2026-08-04T06:00:00.000Z');
  return LocalOrder.create({
    id: ORDER_ID,
    localId: LOCAL_ID,
    userId: null,
    attendeeName: 'Andrea',
    pickupCode: 'ABC234',
    pickupZone: 'Barra norte',
    paymentMethod: 'cash_register',
    totalAmount: 35,
    currency: 'PEN',
    items: [
      LocalOrderItem.create({
        id: '33333333-3333-3333-3333-333333333333',
        productId: '44444444-4444-4444-4444-444444444444',
        quantity: 1,
        unitAmount: 35,
        lineAmount: 35,
      }),
    ],
    createdAt: now,
    updatedAt: now,
  });
}

function build() {
  const orders = new InMemoryLocalOrderRepository();
  orders.seed(order());
  return new AdvanceLocalOrderStatusUseCase(
    orders,
    new FakeResourceTenant('company-a'),
  );
}

describe('AdvanceLocalOrderStatusUseCase', () => {
  it('rechaza a admin_local aunque pertenezca al tenant', async () => {
    const useCase = build();

    await expect(
      useCase.execute({
        orderId: ORDER_ID,
        localId: LOCAL_ID,
        status: 'preparing',
        actorRoles: ['admin_local'],
        scope: scopeForCompany('company-a'),
      }),
    ).rejects.toBeInstanceOf(OrderStatusAdvanceForbiddenError);
  });

  it('permite a staff avanzar de received a preparing', async () => {
    const useCase = build();

    const updated = await useCase.execute({
      orderId: ORDER_ID,
      localId: LOCAL_ID,
      status: 'preparing',
      actorRoles: ['staff'],
      scope: scopeForCompany('company-a'),
    });

    expect(updated.status).toBe('preparing');
  });

  it('rechaza el salto ilegal received a delivered', async () => {
    const useCase = build();

    await expect(
      useCase.execute({
        orderId: ORDER_ID,
        localId: LOCAL_ID,
        status: 'delivered',
        actorRoles: ['staff'],
        scope: scopeForCompany('company-a'),
      }),
    ).rejects.toBeInstanceOf(InvalidOrderStatusTransitionError);
  });
});
