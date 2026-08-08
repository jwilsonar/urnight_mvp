import { Inject, Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import type { CreateLocalOrderDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import {
  RESOURCE_TENANT_RESOLVER,
  type ResourceTenantResolver,
} from '../../../../shared/tenant/resource-tenant.port';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { LocalOrder, LocalOrderItem } from '../../domain/entities/local-order.entity';
import {
  OrderProductUnavailableError,
  OrdersLocalNotFoundError,
  OrderWindowClosedError,
} from '../../domain/errors/orders.errors';
import {
  LOCAL_ORDER_REPOSITORY,
  type LocalOrderRepository,
} from '../../domain/ports/local-order.repository';
import {
  ORDERS_CATALOG_PORT,
  type OrdersCatalogPort,
  type OrderWindow,
} from '../../domain/ports/orders-catalog.port';

const PICKUP_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ORDER_TIME_ZONE = 'America/Lima';

@Injectable()
export class CreateLocalOrderUseCase {
  private readonly log = createLogger(CreateLocalOrderUseCase.name);

  constructor(
    @Inject(LOCAL_ORDER_REPOSITORY) private readonly orders: LocalOrderRepository,
    @Inject(ORDERS_CATALOG_PORT) private readonly catalog: OrdersCatalogPort,
    @Inject(RESOURCE_TENANT_RESOLVER) private readonly tenant: ResourceTenantResolver,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    localId: string;
    userId: string | null;
    dto: CreateLocalOrderDto;
    now?: Date;
  }): Promise<LocalOrder> {
    const now = input.now ?? new Date();
    return this.uow.run(async (tx) => {
      if (!(await this.tenant.companyIdForLocal(input.localId))) {
        throw new OrdersLocalNotFoundError();
      }

      const windows = await this.catalog.listOrderWindows(input.localId, tx);
      if (!isWithinOrderWindow(windows, now)) throw new OrderWindowClosedError();

      const items: LocalOrderItem[] = [];
      let currency: string | null = null;
      let totalCents = 0;
      for (const requested of input.dto.items) {
        const product = await this.catalog.findProduct(requested.productId, tx);
        if (
          !product ||
          product.localId !== input.localId ||
          !product.isAvailable ||
          (currency !== null && currency !== product.currency)
        ) {
          throw new OrderProductUnavailableError();
        }
        currency = product.currency;
        const unitCents = toCents(product.amount);
        const lineCents = unitCents * requested.quantity;
        totalCents += lineCents;
        items.push(
          LocalOrderItem.create({
            id: randomUUID(),
            productId: product.id,
            quantity: requested.quantity,
            unitAmount: fromCents(unitCents),
            lineAmount: fromCents(lineCents),
          }),
        );
      }

      const order = LocalOrder.create({
        id: randomUUID(),
        localId: input.localId,
        userId: input.userId,
        attendeeName: input.dto.attendeeName,
        pickupCode: await this.availablePickupCode(input.localId, tx),
        pickupZone: input.dto.pickupZone,
        paymentMethod: input.dto.paymentMethod,
        totalAmount: fromCents(totalCents),
        currency: currency ?? 'PEN',
        items,
        createdAt: now,
        updatedAt: now,
      });
      await this.orders.create(order, tx);
      this.log.info({ orderId: order.id, localId: order.localId }, 'orders.order.created');
      return order;
    });
  }

  private async availablePickupCode(localId: string, tx: unknown): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = Array.from(
        { length: 6 },
        () => PICKUP_ALPHABET[randomInt(PICKUP_ALPHABET.length)],
      ).join('');
      if (!(await this.orders.isOpenPickupCode(localId, code, tx))) return code;
    }
    throw new Error('No se pudo generar un código de recojo disponible.');
  }
}

export function isWithinOrderWindow(windows: readonly OrderWindow[], instant: Date): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ORDER_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdays[parts.weekday ?? ''];
  if (day === undefined) return false;
  const current = Number(parts.hour) * 60 + Number(parts.minute);

  return windows.some((window) => {
    const starts = timeToMinutes(window.startsAt);
    const ends = timeToMinutes(window.endsAt);
    if (starts < ends) {
      return window.dayOfWeek === day && current >= starts && current < ends;
    }
    return (
      (window.dayOfWeek === day && current >= starts) ||
      ((window.dayOfWeek + 1) % 7 === day && current < ends)
    );
  });
}

function timeToMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(value: number): number {
  return value / 100;
}
