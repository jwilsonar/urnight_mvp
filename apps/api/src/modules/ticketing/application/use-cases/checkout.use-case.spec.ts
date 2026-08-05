import { describe, expect, it } from 'vitest';
import { createOrderSchema } from '@urnight/contracts';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import {
  captureEvents,
  FakePromoRedemption,
  RecordingOutbox,
  fakeUnitOfWork,
} from '../../../../shared/testing/fakes';
import {
  CreateOrderDtoBuilder,
  SaleEventBuilder,
  SaleTicketTypeBuilder,
  attendeeDto,
  yearsAgo,
} from '../../../../shared/testing/builders/ticketing';
import {
  FakeLockPort,
  FakePaymentPort,
  InMemoryInventoryRepository,
  InMemoryOrderRepository,
  InMemoryPaymentRepository,
  InMemoryTicketHoldRepository,
  InMemoryTicketRepository,
} from '../../../../shared/testing/in-memory/ticketing';
import {
  EventNotOnSaleError,
  InsufficientStockError,
  MaxPerUserExceededError,
  PaymentRejectedError,
  StockLockedError,
  TicketTypeNotFoundError,
  TicketTypeUnavailableError,
} from '../../domain/errors/checkout.errors';
import { AttendeeUnderageError } from '../../domain/errors/checkout.errors';
import type { IdempotencyStore } from '../../domain/ports/idempotency.port';
import { ConvertTicketHoldUseCase } from './convert-ticket-hold.use-case';
import { CheckoutUseCase } from './checkout.use-case';

/** Store de idempotencia en memoria (M3): mapea (userId,key) → orderId. */
class FakeIdempotencyStore implements IdempotencyStore {
  private readonly map = new Map<string, string>();
  private keyOf(userId: string, key: string): string {
    return `${userId}:${key}`;
  }
  async recall(userId: string, key: string): Promise<string | null> {
    return this.map.get(this.keyOf(userId, key)) ?? null;
  }
  async remember(userId: string, key: string, orderId: string): Promise<void> {
    if (!this.map.has(this.keyOf(userId, key))) this.map.set(this.keyOf(userId, key), orderId);
  }
}

const EVENT_ID = '11111111-1111-1111-1111-111111111111';
const TT_ID = '22222222-2222-2222-2222-222222222222';

function build(options: { lock?: FakeLockPort; payment?: FakePaymentPort } = {}) {
  const orders = new InMemoryOrderRepository();
  const tickets = new InMemoryTicketRepository();
  const payments = new InMemoryPaymentRepository();
  const inventory = new InMemoryInventoryRepository();
  const holds = new InMemoryTicketHoldRepository();
  const paymentPort = options.payment ?? new FakePaymentPort();
  const lock = options.lock ?? new FakeLockPort();
  const uow = fakeUnitOfWork();
  const events = new EventBus();
  const outbox = new RecordingOutbox();
  const promo = new FakePromoRedemption();
  const idempotency = new FakeIdempotencyStore();
  const convertHold = new ConvertTicketHoldUseCase(holds, inventory, uow);

  inventory.seedEvent(new SaleEventBuilder().withId(EVENT_ID).build());
  inventory.seedTicketType(
    new SaleTicketTypeBuilder().withId(TT_ID).withEvent(EVENT_ID).withPrice(50).withStock(10).build(),
  );

  const useCase = new CheckoutUseCase(
    orders,
    tickets,
    payments,
    inventory,
    paymentPort,
    lock,
    uow,
    events,
    outbox,
    promo,
    idempotency,
    convertHold,
  );
  return {
    useCase,
    orders,
    tickets,
    payments,
    inventory,
    holds,
    paymentPort,
    lock,
    events,
    outbox,
    idempotency,
  };
}

const dto = () =>
  new CreateOrderDtoBuilder()
    .withEvent(EVENT_ID)
    .withSingleItem(TT_ID, [attendeeDto({ isBuyer: true }), attendeeDto({ documentNumber: '87654321' })])
    .withReferralCode('REF12345')
    .build();

describe('CheckoutUseCase', () => {
  it('compra: crea orden pagada, emite tickets, reserva stock y encola notificación', async () => {
    const { useCase, orders, tickets, payments, inventory, outbox } = build();

    const result = await useCase.execute({ userId: 'user-1', dto: dto() });

    expect(result.order.status).toBe('paid');
    expect(result.order.total).toBe(100); // 2 * 50
    expect(result.tickets).toHaveLength(2);
    expect(orders.all).toHaveLength(1);
    expect(payments.all).toHaveLength(1);
    expect(payments.all[0]?.status).toBe('approved');
    expect(tickets.size).toBe(2);
    expect(inventory.soldOf(TT_ID)).toBe(2);
    expect(inventory.countersOf(EVENT_ID).ticketsSold).toBe(2);
    expect(outbox.byName('send-order-tickets')).toBeDefined();
  });

  it('convierte el hold asociado al item cuando el pago se confirma', async () => {
    const { useCase, holds, inventory } = build();
    const holdId = '33333333-3333-3333-3333-333333333333';
    holds.seedActive({
      id: holdId,
      eventId: EVENT_ID,
      ticketTypeId: TT_ID,
      userId: 'user-1',
      quantity: 2,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    const input = dto();
    input.items[0]!.holdId = holdId;

    const result = await useCase.execute({
      userId: 'user-1',
      scope: { isSuperAdmin: false, companyId: null },
      dto: input,
    });

    expect(result.order.status).toBe('paid');
    expect(holds.byId(holdId)?.status).toBe('converted');
    expect(holds.byId(holdId)?.orderId).toBe(result.order.id);
    expect(inventory.soldOf(TT_ID)).toBe(2);
  });

  it('emite OrderPaid y un TicketIssued por entrada (EventBus real + captureEvents)', async () => {
    const { useCase, events } = build();
    const captured = captureEvents(events, 'checkout.order_paid', 'checkout.ticket_issued');

    await useCase.execute({ userId: 'user-1', dto: dto() });

    expect(captured.byName('checkout.order_paid')).toHaveLength(1);
    expect(captured.byName('checkout.ticket_issued')).toHaveLength(2);
    const paid = captured.byName('checkout.order_paid')[0]?.payload as { referralCode: string | null };
    expect(paid.referralCode).toBe('REF12345');
  });

  it('pasa los datos correctos al cobro y deja el inventario fuera del lock Redis', async () => {
    const payment = new FakePaymentPort();
    const lock = new FakeLockPort();
    const { useCase } = build({ payment, lock });

    await useCase.execute({ userId: 'user-1', dto: dto() });

    expect(lock.keys).not.toContain(`event:${EVENT_ID}`);
    expect(payment.lastCharge()?.amount).toBe(100);
    expect(payment.lastCharge()?.currency).toBe('PEN');
    expect(payment.lastCharge()?.method).toBe('card');
  });

  it('rechaza si el evento no está a la venta → EventNotOnSaleError', async () => {
    const { useCase, inventory } = build();
    inventory.seedEvent(new SaleEventBuilder().withId(EVENT_ID).notOnSale().build());
    await expect(useCase.execute({ userId: 'u', dto: dto() })).rejects.toBeInstanceOf(
      EventNotOnSaleError,
    );
  });

  it('rechaza si el tipo de entrada no existe → TicketTypeNotFoundError', async () => {
    const { useCase } = build();
    const bad = new CreateOrderDtoBuilder()
      .withEvent(EVENT_ID)
      .withSingleItem('33333333-3333-3333-3333-333333333333', [attendeeDto({ isBuyer: true })])
      .build();
    await expect(useCase.execute({ userId: 'u', dto: bad })).rejects.toBeInstanceOf(
      TicketTypeNotFoundError,
    );
  });

  it('rechaza si el tipo de entrada no está activo → TicketTypeUnavailableError', async () => {
    const { useCase, inventory } = build();
    inventory.seedTicketType(
      new SaleTicketTypeBuilder().withId(TT_ID).withEvent(EVENT_ID).withStatus('paused').build(),
    );
    await expect(useCase.execute({ userId: 'u', dto: dto() })).rejects.toBeInstanceOf(
      TicketTypeUnavailableError,
    );
  });

  it('rechaza si excede el máximo por usuario → MaxPerUserExceededError', async () => {
    const { useCase, inventory } = build();
    inventory.seedTicketType(
      new SaleTicketTypeBuilder()
        .withId(TT_ID)
        .withEvent(EVENT_ID)
        .withStock(10)
        .withMaxPerUser(1)
        .build(),
    );
    await expect(useCase.execute({ userId: 'u', dto: dto() })).rejects.toBeInstanceOf(
      MaxPerUserExceededError,
    );
  });

  it('rechaza si no hay stock suficiente → InsufficientStockError (sin sobreventa)', async () => {
    const { useCase, inventory } = build();
    inventory.seedTicketType(
      new SaleTicketTypeBuilder().withId(TT_ID).withEvent(EVENT_ID).withStock(5).withSold(4).build(),
    );
    await expect(useCase.execute({ userId: 'u', dto: dto() })).rejects.toBeInstanceOf(
      InsufficientStockError,
    );
    expect(inventory.soldOf(TT_ID)).toBe(4); // no se vendió de más
  });

  it('NO sobrevende: la barrera CHECK (sold<=stock) deja exactamente el stock vendido', async () => {
    const { useCase, inventory } = build();
    // Stock 2: la primera compra (2 entradas) llena el stock; la segunda falla.
    inventory.seedTicketType(
      new SaleTicketTypeBuilder().withId(TT_ID).withEvent(EVENT_ID).withStock(2).withSold(0).build(),
    );
    await useCase.execute({ userId: 'u1', dto: dto() });
    expect(inventory.soldOf(TT_ID)).toBe(2);
    await expect(useCase.execute({ userId: 'u2', dto: dto() })).rejects.toBeInstanceOf(
      InsufficientStockError,
    );
    expect(inventory.soldOf(TT_ID)).toBe(2); // nunca supera el stock
  });

  it('si el pago es rechazado lanza PaymentRejectedError y no persiste la orden (rollback)', async () => {
    const payment = new FakePaymentPort().rejecting('Tarjeta rechazada');
    const { useCase, orders, payments, tickets } = build({ payment });
    await expect(useCase.execute({ userId: 'u', dto: dto() })).rejects.toBeInstanceOf(
      PaymentRejectedError,
    );
    expect(orders.all).toHaveLength(0);
    expect(payments.all).toHaveLength(0);
    expect(tickets.size).toBe(0);
  });

  it('rechaza la compra si algún asistente es menor de edad → AttendeeUnderageError (18+)', async () => {
    const { useCase } = build();
    const minor = new CreateOrderDtoBuilder()
      .withEvent(EVENT_ID)
      .withSingleItem(TT_ID, [
        attendeeDto({ isBuyer: true, birthDate: yearsAgo(15).toISOString().slice(0, 10) }),
      ])
      .build();
    await expect(useCase.execute({ userId: 'u', dto: minor })).rejects.toBeInstanceOf(
      AttendeeUnderageError,
    );
  });

  it('traduce el lock de idempotencia no disponible a StockLockedError', async () => {
    const lock = new FakeLockPort().unavailable();
    const { useCase } = build({ lock });
    await expect(
      useCase.execute({
        userId: 'u',
        dto: dto(),
        idempotencyKey: 'same-request',
      }),
    ).rejects.toBeInstanceOf(StockLockedError);
  });

  it('M3: idempotencia — misma key + mismo usuario devuelve la orden ya creada (no cobra dos veces)', async () => {
    const { useCase, orders, payments, inventory } = build();

    const first = await useCase.execute({ userId: 'user-1', dto: dto(), idempotencyKey: 'idem-1' });
    const second = await useCase.execute({ userId: 'user-1', dto: dto(), idempotencyKey: 'idem-1' });

    expect(second.order.id).toBe(first.order.id);
    expect(orders.all).toHaveLength(1); // no se creó una segunda orden
    expect(payments.all).toHaveLength(1); // no se cobró dos veces
    expect(inventory.soldOf(TT_ID)).toBe(2); // stock reservado una sola vez
    expect(second.tickets).toHaveLength(first.tickets.length);
  });

  it('M3: keys distintas del mismo usuario crean órdenes distintas', async () => {
    const { useCase, orders } = build();
    await useCase.execute({ userId: 'user-1', dto: dto(), idempotencyKey: 'idem-A' });
    await useCase.execute({ userId: 'user-1', dto: dto(), idempotencyKey: 'idem-B' });
    expect(orders.all).toHaveLength(2);
  });
});

describe('createOrderSchema (M2: items duplicados)', () => {
  const attendee = {
    fullName: 'Grace Hopper',
    documentType: 'dni' as const,
    documentNumber: '12345678',
    birthDate: '1990-01-01',
    isBuyer: true,
  };
  const TT = '22222222-2222-2222-2222-222222222222';

  it('rechaza dos líneas con el mismo ticketTypeId', () => {
    const res = createOrderSchema.safeParse({
      eventId: '11111111-1111-1111-1111-111111111111',
      method: 'card',
      items: [
        { ticketTypeId: TT, attendees: [attendee] },
        { ticketTypeId: TT, attendees: [{ ...attendee, documentNumber: '87654321' }] },
      ],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.join('.').includes('ticketTypeId'))).toBe(true);
    }
  });

  it('acepta líneas con ticketTypeId distintos', () => {
    const res = createOrderSchema.safeParse({
      eventId: '11111111-1111-1111-1111-111111111111',
      method: 'card',
      items: [
        { ticketTypeId: TT, attendees: [attendee] },
        { ticketTypeId: '33333333-3333-3333-3333-333333333333', attendees: [attendee] },
      ],
    });
    expect(res.success).toBe(true);
  });
});
