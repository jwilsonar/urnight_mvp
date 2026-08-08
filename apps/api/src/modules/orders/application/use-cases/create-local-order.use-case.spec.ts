import { describe, expect, it } from 'vitest';
import { FakeResourceTenant, fakeUnitOfWork } from '../../../../shared/testing/fakes';
import {
  InMemoryLocalOrderRepository,
  InMemoryOrdersCatalog,
} from '../../../../shared/testing/in-memory/orders';
import {
  OrderProductUnavailableError,
  OrderWindowClosedError,
} from '../../domain/errors/orders.errors';
import { CreateLocalOrderUseCase } from './create-local-order.use-case';

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';
const PRODUCT_ID = '22222222-2222-2222-2222-222222222222';

function build() {
  const orders = new InMemoryLocalOrderRepository();
  const catalog = new InMemoryOrdersCatalog();
  catalog.seedProduct({
    id: PRODUCT_ID,
    localId: LOCAL_ID,
    isAvailable: true,
    amount: 35,
    currency: 'PEN',
  });
  catalog.seedWindow({
    localId: LOCAL_ID,
    dayOfWeek: 1,
    startsAt: '22:00',
    endsAt: '03:00',
  });
  return {
    orders,
    catalog,
    useCase: new CreateLocalOrderUseCase(
      orders,
      catalog,
      new FakeResourceTenant('company-a'),
      fakeUnitOfWork(),
    ),
  };
}

function input(now: Date) {
  return {
    localId: LOCAL_ID,
    userId: null,
    dto: {
      attendeeName: 'Andrea',
      pickupZone: 'Barra norte',
      paymentMethod: 'wallet' as const,
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
    },
    now,
  };
}

describe('CreateLocalOrderUseCase', () => {
  it('rechaza un pedido fuera del horario configurado', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute(input(new Date('2026-08-03T20:00:00.000Z'))),
    ).rejects.toBeInstanceOf(OrderWindowClosedError);
  });

  it('acepta a la 1 a.m. una ventana del día anterior que cruza 22:00-03:00', async () => {
    const { useCase } = build();

    const order = await useCase.execute(
      input(new Date('2026-08-04T06:00:00.000Z')),
    );

    expect(order.status).toBe('received');
    expect(order.totalAmount).toBe(70);
    expect(order.pickupCode).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
  });

  it('rechaza un producto no disponible', async () => {
    const { catalog, useCase } = build();
    catalog.setAvailability(PRODUCT_ID, false);

    await expect(
      useCase.execute(input(new Date('2026-08-04T06:00:00.000Z'))),
    ).rejects.toBeInstanceOf(OrderProductUnavailableError);
  });

  it('conserva unit_amount aunque cambie el precio vigente después', async () => {
    const { catalog, orders, useCase } = build();
    const created = await useCase.execute(
      input(new Date('2026-08-04T06:00:00.000Z')),
    );

    catalog.setPrice(PRODUCT_ID, 48);
    const stored = await orders.findById(created.id);

    expect(stored?.items[0]?.unitAmount).toBe(35);
    expect(stored?.items[0]?.lineAmount).toBe(70);
  });
});
