import { OrderNotPayableError } from '../errors/checkout.errors';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface OrderItemProps {
  id: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** Línea de orden con precio snapshot (denormalizado §invariantes). */
export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}

  static create(input: {
    id: string;
    ticketTypeId: string;
    quantity: number;
    unitPrice: number;
  }): OrderItem {
    return new OrderItem({
      ...input,
      lineTotal: round2(input.unitPrice * input.quantity),
    });
  }

  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  get id(): string {
    return this.props.id;
  }
  get ticketTypeId(): string {
    return this.props.ticketTypeId;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitPrice(): number {
    return this.props.unitPrice;
  }
  get lineTotal(): number {
    return this.props.lineTotal;
  }
}

export interface OrderProps {
  id: string;
  orderCode: string;
  userId: string;
  eventId: string;
  subtotal: number;
  discountTotal: number;
  commissionAmount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  paidAt: Date | null;
}

/** Aggregate Order (§4.1). Calcula totales + snapshot de comisión. */
export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(input: {
    id: string;
    orderCode: string;
    userId: string;
    eventId: string;
    currency: string;
    commissionRate: number;
    discountTotal?: number;
    items: { id: string; ticketTypeId: string; quantity: number; unitPrice: number }[];
  }): Order {
    const items = input.items.map((i) => OrderItem.create(i));
    const subtotal = round2(items.reduce((acc, i) => acc + i.lineTotal, 0));
    const discountTotal = round2(input.discountTotal ?? 0);
    const commissionAmount = round2(subtotal * input.commissionRate);
    const total = round2(Math.max(0, subtotal - discountTotal));
    return new Order({
      id: input.id,
      orderCode: input.orderCode,
      userId: input.userId,
      eventId: input.eventId,
      subtotal,
      discountTotal,
      commissionAmount,
      total,
      currency: input.currency,
      status: 'pending',
      items,
      createdAt: new Date(),
      paidAt: null,
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  isPayable(): boolean {
    return this.props.status === 'pending';
  }

  /**
   * Confirma el pago (M17): invariante — solo una orden `isPayable()` (pending)
   * puede pasar a `paid`. Evita reconfirmar/mutar órdenes ya pagadas o fallidas.
   */
  confirmPayment(at: Date = new Date()): void {
    if (!this.isPayable()) throw new OrderNotPayableError();
    this.props.status = 'paid';
    this.props.paidAt = at;
  }

  fail(): void {
    this.props.status = 'failed';
  }

  applyDiscount(discount: number): void {
    this.props.discountTotal = round2(discount);
    this.props.total = round2(Math.max(0, this.props.subtotal - this.props.discountTotal));
  }

  totalQuantity(): number {
    return this.props.items.reduce((acc, i) => acc + i.quantity, 0);
  }

  get id(): string {
    return this.props.id;
  }
  get orderCode(): string {
    return this.props.orderCode;
  }
  get userId(): string {
    return this.props.userId;
  }
  get eventId(): string {
    return this.props.eventId;
  }
  get subtotal(): number {
    return this.props.subtotal;
  }
  get discountTotal(): number {
    return this.props.discountTotal;
  }
  get commissionAmount(): number {
    return this.props.commissionAmount;
  }
  get total(): number {
    return this.props.total;
  }
  get currency(): string {
    return this.props.currency;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get items(): OrderItem[] {
    return this.props.items;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get paidAt(): Date | null {
    return this.props.paidAt;
  }
}
