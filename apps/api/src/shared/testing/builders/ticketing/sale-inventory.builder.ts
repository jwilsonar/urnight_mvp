import type {
  SaleEvent,
  SaleTicketType,
} from '../../../../modules/ticketing/domain/ports/inventory.repository';

/** Builder para el snapshot de inventario `SaleEvent` (puerto de inventario). */
export class SaleEventBuilder {
  private id = 'event-1';
  private status = 'published';
  private localId = 'local-1';
  private companyId = 'company-1';
  private isOnSale = true;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withStatus(status: string): this {
    this.status = status;
    return this;
  }

  withLocal(localId: string): this {
    this.localId = localId;
    return this;
  }

  withCompany(companyId: string): this {
    this.companyId = companyId;
    return this;
  }

  notOnSale(): this {
    this.isOnSale = false;
    return this;
  }

  build(): SaleEvent {
    return {
      id: this.id,
      status: this.status,
      localId: this.localId,
      companyId: this.companyId,
      isOnSale: this.isOnSale,
    };
  }
}

/** Builder para el snapshot de inventario `SaleTicketType` (stock/sold). */
export class SaleTicketTypeBuilder {
  private id = 'tt-1';
  private eventId = 'event-1';
  private price = 50;
  private currency = 'PEN';
  private stock = 100;
  private sold = 0;
  private maxPerUser: number | null = null;
  private status = 'active';

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withEvent(eventId: string): this {
    this.eventId = eventId;
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

  withStatus(status: string): this {
    this.status = status;
    return this;
  }

  /** Deja exactamente `available` unidades disponibles (stock - sold). */
  withAvailable(available: number): this {
    this.sold = this.stock - available;
    return this;
  }

  build(): SaleTicketType {
    return {
      id: this.id,
      eventId: this.eventId,
      price: this.price,
      currency: this.currency,
      stock: this.stock,
      sold: this.sold,
      maxPerUser: this.maxPerUser,
      status: this.status,
    };
  }
}
