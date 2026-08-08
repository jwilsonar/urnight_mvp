import { describe, expect, it } from 'vitest';
import { FakeResourceTenant, scopeForCompany } from '../../../../shared/testing/fakes';
import { InMemoryLocalOrderRepository } from '../../../../shared/testing/in-memory/orders';
import { LocalOrder } from '../../domain/entities/local-order.entity';
import { ListLocalOrderQueueUseCase } from './list-local-order-queue.use-case';

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';

function order(id: string, localId: string, status: 'received' | 'delivered'): LocalOrder {
  const now = new Date('2026-08-04T06:00:00.000Z');
  return LocalOrder.create({
    id,
    localId,
    userId: null,
    attendeeName: 'Andrea',
    pickupCode: id.slice(0, 6).toUpperCase(),
    pickupZone: 'Barra norte',
    status,
    paymentMethod: 'cash_register',
    totalAmount: 35,
    currency: 'PEN',
    items: [],
    createdAt: now,
    updatedAt: now,
  });
}

describe('ListLocalOrderQueueUseCase', () => {
  it('lista solo la cola abierta del local autorizado', async () => {
    const orders = new InMemoryLocalOrderRepository();
    orders.seed(order('22222222-2222-2222-2222-222222222222', LOCAL_ID, 'received'));
    orders.seed(order('33333333-3333-3333-3333-333333333333', LOCAL_ID, 'delivered'));
    orders.seed(
      order(
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
        'received',
      ),
    );
    const useCase = new ListLocalOrderQueueUseCase(
      orders,
      new FakeResourceTenant('company-a'),
    );

    const result = await useCase.execute({
      localId: LOCAL_ID,
      scope: scopeForCompany('company-a'),
    });

    expect(result.map((item) => item.id)).toEqual([
      '22222222-2222-2222-2222-222222222222',
    ]);
  });
});
