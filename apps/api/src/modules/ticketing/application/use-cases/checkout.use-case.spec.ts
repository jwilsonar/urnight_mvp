import { describe, expect, it } from 'vitest';
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
import type { StoragePort } from '../../../../shared/adapters/storage/storage.port';
import type { QrImagePort } from '../../domain/ports/qr-image.port';
import { CheckoutUseCase } from './checkout.use-case';

/** Storage en memoria: registra las keys subidas; el resto son no-ops. */
const fakeStorage = (): StoragePort =>
  ({
    putObject: async () => undefined,
    getUploadUrl: async () => '',
    getDownloadUrl: async () => '',
    headObject: async () => ({ sizeBytes: 0, contentType: 'image/png' }),
    copyObject: async () => undefined,
    deleteObject: async () => undefined,
    resolveUrl: (ref: string) => ref,
    toKey: (ref: string) => ref,
  }) satisfies StoragePort;

const fakeQrImage = (): QrImagePort => ({ render: async () => Buffer.from('png') });

const EVENT_ID = '11111111-1111-1111-1111-111111111111';
const TT_ID = '22222222-2222-2222-2222-222222222222';

function build(options: { lock?: FakeLockPort; payment?: FakePaymentPort } = {}) {
  const orders = new InMemoryOrderRepository();
  const tickets = new InMemoryTicketRepository();
  const payments = new InMemoryPaymentRepository();
  const inventory = new InMemoryInventoryRepository();
  const paymentPort = options.payment ?? new FakePaymentPort();
  const lock = options.lock ?? new FakeLockPort();
  const uow = fakeUnitOfWork();
  const events = new EventBus();
  const outbox = new RecordingOutbox();
  const promo = new FakePromoRedemption();

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
    fakeStorage(),
    fakeQrImage(),
  );
  return { useCase, orders, tickets, payments, inventory, paymentPort, lock, events, outbox };
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

  it('emite OrderPaid y un TicketIssued por entrada (EventBus real + captureEvents)', async () => {
    const { useCase, events } = build();
    const captured = captureEvents(events, 'checkout.order_paid', 'checkout.ticket_issued');

    await useCase.execute({ userId: 'user-1', dto: dto() });

    expect(captured.byName('checkout.order_paid')).toHaveLength(1);
    expect(captured.byName('checkout.ticket_issued')).toHaveLength(2);
    const paid = captured.byName('checkout.order_paid')[0]?.payload as { referralCode: string | null };
    expect(paid.referralCode).toBe('REF12345');
  });

  it('pasa los datos correctos al cobro y al lock (repo args)', async () => {
    const payment = new FakePaymentPort();
    const lock = new FakeLockPort();
    const { useCase } = build({ payment, lock });

    await useCase.execute({ userId: 'user-1', dto: dto() });

    expect(lock.keys).toContain(`event:${EVENT_ID}`);
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

  it('traduce el lock no disponible a StockLockedError (doble barrera)', async () => {
    const lock = new FakeLockPort().unavailable();
    const { useCase } = build({ lock });
    await expect(useCase.execute({ userId: 'u', dto: dto() })).rejects.toBeInstanceOf(
      StockLockedError,
    );
  });
});
