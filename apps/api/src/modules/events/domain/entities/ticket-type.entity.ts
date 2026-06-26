export type TicketTier = 'general' | 'vip' | 'premium';
export type TicketTypeStatus = 'active' | 'paused' | 'sold_out';

export interface TicketTypeProps {
  id: string;
  eventId: string;
  name: string;
  tierCode: TicketTier;
  price: number;
  currency: string;
  stock: number;
  sold: number;
  maxPerUser: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  status: TicketTypeStatus;
  createdAt: Date;
}

/** Aggregate TicketType (§4.1). Invariante: sold <= stock (no sobreventa). */
export class TicketType {
  private constructor(private readonly props: TicketTypeProps) {}

  static create(input: {
    id: string;
    eventId: string;
    name: string;
    tierCode: TicketTier;
    price: number;
    currency: string;
    stock: number;
    maxPerUser?: number | null;
    saleStartsAt?: Date | null;
    saleEndsAt?: Date | null;
  }): TicketType {
    return new TicketType({
      id: input.id,
      eventId: input.eventId,
      name: input.name.trim(),
      tierCode: input.tierCode,
      price: input.price,
      currency: input.currency,
      stock: input.stock,
      sold: 0,
      maxPerUser: input.maxPerUser ?? null,
      saleStartsAt: input.saleStartsAt ?? null,
      saleEndsAt: input.saleEndsAt ?? null,
      status: 'active',
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: TicketTypeProps): TicketType {
    return new TicketType(props);
  }

  remaining(): number {
    return this.props.stock - this.props.sold;
  }

  isAvailable(): boolean {
    return this.props.status === 'active' && this.remaining() > 0;
  }

  get id(): string {
    return this.props.id;
  }
  get eventId(): string {
    return this.props.eventId;
  }
  get name(): string {
    return this.props.name;
  }
  get tierCode(): TicketTier {
    return this.props.tierCode;
  }
  get price(): number {
    return this.props.price;
  }
  get currency(): string {
    return this.props.currency;
  }
  get stock(): number {
    return this.props.stock;
  }
  get sold(): number {
    return this.props.sold;
  }
  get maxPerUser(): number | null {
    return this.props.maxPerUser;
  }
  get status(): TicketTypeStatus {
    return this.props.status;
  }
}
