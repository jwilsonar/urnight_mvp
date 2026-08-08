import type {
  LocalOrderPaymentMethod,
  LocalOrderPaymentStatus,
  LocalOrderStatus,
} from '@urnight/contracts';
import {
  InvalidOrderStatusTransitionError,
  LocalOrderAlreadyPaidError,
} from '../errors/orders.errors';

export interface LocalOrderItemProps {
  id: string;
  productId: string;
  quantity: number;
  unitAmount: number;
  lineAmount: number;
}

export class LocalOrderItem {
  private constructor(private readonly props: LocalOrderItemProps) {}

  static create(props: LocalOrderItemProps): LocalOrderItem {
    return new LocalOrderItem(props);
  }

  static fromPersistence(props: LocalOrderItemProps): LocalOrderItem {
    return new LocalOrderItem(props);
  }

  get id(): string {
    return this.props.id;
  }
  get productId(): string {
    return this.props.productId;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitAmount(): number {
    return this.props.unitAmount;
  }
  get lineAmount(): number {
    return this.props.lineAmount;
  }
}

export interface LocalOrderProps {
  id: string;
  localId: string;
  userId: string | null;
  attendeeName: string;
  pickupCode: string;
  pickupZone: string;
  status: LocalOrderStatus;
  paymentMethod: LocalOrderPaymentMethod;
  paymentStatus: LocalOrderPaymentStatus;
  totalAmount: number;
  currency: string;
  items: LocalOrderItem[];
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TRANSITIONS: Readonly<Record<LocalOrderStatus, readonly LocalOrderStatus[]>> = {
  received: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
};

export class LocalOrder {
  private constructor(private readonly props: LocalOrderProps) {}

  static create(
    input: Omit<LocalOrderProps, 'status' | 'paymentStatus' | 'paidAt'> &
      Partial<Pick<LocalOrderProps, 'status' | 'paymentStatus' | 'paidAt'>>,
  ): LocalOrder {
    return new LocalOrder({
      ...input,
      attendeeName: input.attendeeName.trim(),
      pickupZone: input.pickupZone.trim(),
      status: input.status ?? 'received',
      paymentStatus: input.paymentStatus ?? 'pending',
      paidAt: input.paidAt ?? null,
      items: [...input.items],
    });
  }

  static fromPersistence(props: LocalOrderProps): LocalOrder {
    return new LocalOrder({ ...props, items: [...props.items] });
  }

  advanceTo(status: LocalOrderStatus, now = new Date()): void {
    if (!TRANSITIONS[this.props.status].includes(status)) {
      throw new InvalidOrderStatusTransitionError();
    }
    this.props.status = status;
    this.props.updatedAt = now;
  }

  markPaid(method: LocalOrderPaymentMethod, now = new Date()): void {
    if (this.props.paymentStatus === 'paid') throw new LocalOrderAlreadyPaidError();
    this.props.paymentMethod = method;
    this.props.paymentStatus = 'paid';
    this.props.paidAt = now;
    this.props.updatedAt = now;
  }

  get id(): string {
    return this.props.id;
  }
  get localId(): string {
    return this.props.localId;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get attendeeName(): string {
    return this.props.attendeeName;
  }
  get pickupCode(): string {
    return this.props.pickupCode;
  }
  get pickupZone(): string {
    return this.props.pickupZone;
  }
  get status(): LocalOrderStatus {
    return this.props.status;
  }
  get paymentMethod(): LocalOrderPaymentMethod {
    return this.props.paymentMethod;
  }
  get paymentStatus(): LocalOrderPaymentStatus {
    return this.props.paymentStatus;
  }
  get totalAmount(): number {
    return this.props.totalAmount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get items(): readonly LocalOrderItem[] {
    return [...this.props.items];
  }
  get paidAt(): Date | null {
    return this.props.paidAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
