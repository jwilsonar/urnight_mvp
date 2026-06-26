import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type { CreateOrderDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../shared/adapters/storage/storage.port';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { LockPort, LockUnavailableError } from '../../../../shared/locking/lock.port';
import { OutboxPort } from '../../../../shared/outbox/outbox.port';
import { QR_IMAGE_PORT, type QrImagePort } from '../../domain/ports/qr-image.port';
import { PromoRedemptionPort } from '../../../../shared/ports/promo-redemption.port';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { Attendee } from '../../domain/entities/attendee.entity';
import { Order } from '../../domain/entities/order.entity';
import { Payment } from '../../domain/entities/payment.entity';
import { Ticket } from '../../domain/entities/ticket.entity';
import {
  EventNotOnSaleError,
  InsufficientStockError,
  MaxPerUserExceededError,
  PaymentRejectedError,
  StockLockedError,
  TicketTypeNotFoundError,
  TicketTypeUnavailableError,
} from '../../domain/errors/checkout.errors';
import { OrderPaidEvent, TicketIssuedEvent } from '../../domain/events/checkout.events';
import { INVENTORY_PORT, type InventoryPort } from '../../domain/ports/inventory.repository';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/ports/order.repository';
import { PAYMENT_REPOSITORY, type PaymentRepository } from '../../domain/ports/payment.repository';
import { PaymentPort } from '../../domain/ports/payment.port';
import {
  TICKET_REPOSITORY,
  type IssuedTicket,
  type TicketRepository,
} from '../../domain/ports/ticket.repository';

/** Comisión de plataforma (snapshot). MVP: constante; futuro: PLATFORM_SETTING. */
const COMMISSION_RATE = 0.1;
const LOCK_TTL_MS = 10_000;

function orderCode(): string {
  return `ORD-${randomBytes(4).toString('hex').toUpperCase()}`;
}
function qrToken(): string {
  return randomBytes(24).toString('base64url');
}

export interface CheckoutResult {
  order: Order;
  tickets: IssuedTicket[];
}

interface CheckoutSpec {
  item: CreateOrderDto['items'][number];
  qty: number;
  unitPrice: number;
  currency: string;
}

/**
 * Caso de uso: compra de entradas (checkout + pago en un paso). Doble barrera
 * anti-sobreventa (Redis lock + CHECK sold<=stock + Tx). 18+ por asistente.
 * Pago vía PaymentPort (mock). Emite OrderPaid (atribución/notificaciones).
 */
@Injectable()
export class CheckoutUseCase {
  private readonly log = createLogger(CheckoutUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    private readonly paymentPort: PaymentPort,
    private readonly lock: LockPort,
    private readonly uow: UnitOfWork,
    private readonly events: EventBus,
    private readonly outbox: OutboxPort,
    private readonly promo: PromoRedemptionPort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(QR_IMAGE_PORT) private readonly qrImage: QrImagePort,
  ) {}

  async execute(input: { userId: string; dto: CreateOrderDto }): Promise<CheckoutResult> {
    const { dto } = input;
    this.log.debug(
      { userId: input.userId, eventId: dto.eventId, items: dto.items.length },
      'ticketing.checkout.started',
    );
    const ev = await this.inventory.getEvent(dto.eventId);
    if (!ev || !ev.isOnSale) throw new EventNotOnSaleError();

    // Validación previa (fail-fast) + snapshot de precios.
    const specs: CheckoutSpec[] = [];
    for (const item of dto.items) {
      const qty = item.attendees.length;
      const tt = await this.inventory.getTicketType(item.ticketTypeId);
      if (!tt || tt.eventId !== dto.eventId) throw new TicketTypeNotFoundError();
      if (tt.status !== 'active') throw new TicketTypeUnavailableError();
      if (tt.maxPerUser !== null && qty > tt.maxPerUser) throw new MaxPerUserExceededError();
      if (tt.stock - tt.sold < qty) throw new InsufficientStockError();
      specs.push({ item, qty, unitPrice: tt.price, currency: tt.currency });
    }
    const currency = specs[0]?.currency ?? 'PEN';

    try {
      const result = await this.lock.withLock(`event:${dto.eventId}`, LOCK_TTL_MS, () =>
        this.process(input.userId, dto, specs, currency),
      );
      // QR de cada entrada: PNG → S3 → key (fuera del lock/Tx). Best-effort: si
      // falla, la entrada sigue válida (el token `qrCode` es la fuente de verdad
      // en puerta) y el cliente puede renderizar el QR desde el token.
      await this.generateQrImages(result.tickets);
      return result;
    } catch (err) {
      if (err instanceof LockUnavailableError) {
        this.log.warn({ userId: input.userId, eventId: dto.eventId }, 'ticketing.checkout.stock_locked');
        throw new StockLockedError();
      }
      throw err;
    }
  }

  /** Genera y persiste el PNG del QR de cada entrada emitida (no bloquea el pago). */
  private async generateQrImages(issued: IssuedTicket[]): Promise<void> {
    for (const { ticket } of issued) {
      try {
        const png = await this.qrImage.render(ticket.qrCode);
        const key = `tickets/${ticket.id}/qr.png`;
        await this.storage.putObject(key, png, 'image/png');
        await this.tickets.attachQrImage(ticket.id, key);
        ticket.attachQrImage(key);
        this.log.debug({ ticketId: ticket.id, key }, 'ticketing.qr.image_stored');
      } catch (err) {
        this.log.warn({ ticketId: ticket.id, err }, 'ticketing.qr.image_failed');
      }
    }
  }

  private async process(
    userId: string,
    dto: CreateOrderDto,
    specs: CheckoutSpec[],
    currency: string,
  ): Promise<CheckoutResult> {
    const orderId = randomUUID();
    const totalQty = specs.reduce((acc, s) => acc + s.qty, 0);
    const issued: IssuedTicket[] = [];

    // Código promocional (#21): valida y calcula el descuento (lanza si inválido).
    const subtotal = specs.reduce((acc, s) => acc + s.unitPrice * s.qty, 0);
    const promoApplication = dto.promoCode
      ? await this.promo.preview({
          code: dto.promoCode,
          userId,
          eventId: dto.eventId,
          subtotal,
          items: specs.map((s) => ({
            ticketTypeId: s.item.ticketTypeId,
            lineTotal: s.unitPrice * s.qty,
          })),
        })
      : null;

    const order = Order.create({
      id: orderId,
      orderCode: orderCode(),
      userId,
      eventId: dto.eventId,
      currency,
      commissionRate: COMMISSION_RATE,
      discountTotal: promoApplication?.discount ?? 0,
      items: specs.map((s) => ({
        id: randomUUID(),
        ticketTypeId: s.item.ticketTypeId,
        quantity: s.qty,
        unitPrice: s.unitPrice,
      })),
    });
    const payment = Payment.initiate({
      id: randomUUID(),
      orderId,
      method: dto.method,
      amount: order.total,
    });

    await this.uow.run(async (tx) => {
      // Reserva atómica de stock (CHECK sold<=stock revierte si hay sobreventa).
      for (const s of specs) {
        const fresh = await this.inventory.getTicketType(s.item.ticketTypeId);
        if (!fresh) throw new TicketTypeNotFoundError();
        if (fresh.stock - fresh.sold < s.qty) throw new InsufficientStockError();
        await this.inventory.incrementSold(s.item.ticketTypeId, s.qty, tx);
      }
      await this.inventory.incrementEventTicketsSold(dto.eventId, totalQty, tx);

      // Cobro (mock). Si rechaza, lanza → rollback (stock liberado).
      const charge = await this.paymentPort.charge({
        orderId,
        amount: order.total,
        currency,
        method: dto.method,
      });
      if (!charge.approved) {
        payment.reject(charge.failureReason ?? 'Pago rechazado');
        this.log.warn(
          { orderId, userId, reason: charge.failureReason ?? null },
          'ticketing.checkout.payment_rejected',
        );
        throw new PaymentRejectedError(charge.failureReason);
      }
      payment.approve(charge.reference ?? 'mock');
      order.confirmPayment();

      await this.orders.create(order, tx);
      await this.payments.create(payment, tx);

      // Registra el canje del promo (#13) en la misma Tx (entrega fiable).
      if (promoApplication) {
        await this.promo.redeem(
          {
            promoCodeId: promoApplication.promoCodeId,
            orderId: order.id,
            userId,
            discount: promoApplication.discount,
          },
          tx,
        );
      }

      // Emisión de tickets + asistentes (18+ validado en Attendee.create).
      specs.forEach((s, idx) => {
        const orderItem = order.items[idx]!;
        for (const att of s.item.attendees) {
          const ticketId = randomUUID();
          issued.push({
            ticket: Ticket.issue({
              id: ticketId,
              orderItemId: orderItem.id,
              eventId: dto.eventId,
              ticketTypeId: s.item.ticketTypeId,
              qrCode: qrToken(),
            }),
            attendee: Attendee.create({
              id: randomUUID(),
              ticketId,
              fullName: att.fullName,
              documentType: att.documentType,
              documentNumber: att.documentNumber,
              birthDate: new Date(att.birthDate),
              isBuyer: att.isBuyer,
            }),
          });
        }
      });
      await this.tickets.issueMany(issued, tx);

      // Outbox transaccional (§3.2): el job de entrega de entradas persiste en
      // la MISMA Tx → no se pierde el PDF/email si el proceso cae tras el commit.
      await this.outbox.enqueue(
        {
          queue: 'notifications',
          name: 'send-order-tickets',
          data: { orderId: order.id, userId, ticketIds: issued.map((t) => t.ticket.id) },
        },
        tx,
      );
    });

    await this.events.publish(
      new OrderPaidEvent({
        orderId: order.id,
        userId,
        eventId: dto.eventId,
        total: order.total,
        currency,
        paidAt: (order.paidAt ?? new Date()).toISOString(),
        referralCode: dto.referralCode ?? null,
      }),
    );
    for (const t of issued) {
      await this.events.publish(
        new TicketIssuedEvent({ ticketId: t.ticket.id, eventId: dto.eventId, userId }),
      );
    }
    this.log.info(
      {
        orderId: order.id,
        orderCode: order.orderCode,
        userId,
        eventId: dto.eventId,
        total: order.total,
        currency,
        tickets: issued.length,
        referred: Boolean(dto.referralCode),
      },
      'ticketing.order.paid',
    );

    return { order, tickets: issued };
  }
}
