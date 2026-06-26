import { randomUUID } from 'node:crypto';
import { Order } from '../../../../modules/ticketing/domain/entities/order.entity';

interface ItemInput {
  id: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
}

/** Builder fluido para el aggregate Order (calcula totales + snapshot comisión). */
export class OrderBuilder {
  private id: string = randomUUID();
  private orderCode = 'ORD-TEST';
  private userId = 'user-1';
  private eventId = 'event-1';
  private currency = 'PEN';
  private commissionRate = 0.1;
  private discountTotal: number | undefined = undefined;
  private items: ItemInput[] = [
    { id: 'item-1', ticketTypeId: 'tt-1', quantity: 2, unitPrice: 50 },
  ];

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withOrderCode(orderCode: string): this {
    this.orderCode = orderCode;
    return this;
  }

  withUser(userId: string): this {
    this.userId = userId;
    return this;
  }

  withEvent(eventId: string): this {
    this.eventId = eventId;
    return this;
  }

  withCurrency(currency: string): this {
    this.currency = currency;
    return this;
  }

  withCommissionRate(commissionRate: number): this {
    this.commissionRate = commissionRate;
    return this;
  }

  withDiscount(discountTotal: number): this {
    this.discountTotal = discountTotal;
    return this;
  }

  withItems(items: ItemInput[]): this {
    this.items = items;
    return this;
  }

  build(): Order {
    return Order.create({
      id: this.id,
      orderCode: this.orderCode,
      userId: this.userId,
      eventId: this.eventId,
      currency: this.currency,
      commissionRate: this.commissionRate,
      discountTotal: this.discountTotal,
      items: this.items,
    });
  }
}
