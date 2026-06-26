import { randomUUID } from 'node:crypto';
import {
  TicketType,
  type TicketTier,
  type TicketTypeStatus,
} from '../../../../modules/events/domain/entities/ticket-type.entity';

/** Builder fluido para el aggregate TicketType (§4.1: invariante sold <= stock). */
export class TicketTypeBuilder {
  private id: string = randomUUID();
  private eventId: string = randomUUID();
  private name = 'General';
  private tierCode: TicketTier = 'general';
  private price = 50;
  private currency = 'PEN';
  private stock = 100;
  private sold = 0;
  private maxPerUser: number | null = null;
  private saleStartsAt: Date | null = null;
  private saleEndsAt: Date | null = null;
  private status: TicketTypeStatus = 'active';

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withEventId(eventId: string): this {
    this.eventId = eventId;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withTierCode(tierCode: TicketTier): this {
    this.tierCode = tierCode;
    return this;
  }

  withPrice(price: number): this {
    this.price = price;
    return this;
  }

  withCurrency(currency: string): this {
    this.currency = currency;
    return this;
  }

  withStock(stock: number): this {
    this.stock = stock;
    return this;
  }

  withSold(sold: number): this {
    this.sold = sold;
    return this;
  }

  withMaxPerUser(maxPerUser: number | null): this {
    this.maxPerUser = maxPerUser;
    return this;
  }

  withSaleStartsAt(saleStartsAt: Date | null): this {
    this.saleStartsAt = saleStartsAt;
    return this;
  }

  withSaleEndsAt(saleEndsAt: Date | null): this {
    this.saleEndsAt = saleEndsAt;
    return this;
  }

  withStatus(status: TicketTypeStatus): this {
    this.status = status;
    return this;
  }

  asPaused(): this {
    this.status = 'paused';
    return this;
  }

  asSoldOut(): this {
    this.status = 'sold_out';
    return this;
  }

  build(): TicketType {
    return TicketType.fromPersistence({
      id: this.id,
      eventId: this.eventId,
      name: this.name.trim(),
      tierCode: this.tierCode,
      price: this.price,
      currency: this.currency,
      stock: this.stock,
      sold: this.sold,
      maxPerUser: this.maxPerUser,
      saleStartsAt: this.saleStartsAt,
      saleEndsAt: this.saleEndsAt,
      status: this.status,
      createdAt: new Date(),
    });
  }
}
