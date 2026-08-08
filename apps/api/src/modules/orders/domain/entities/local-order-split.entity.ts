import { LocalOrderSplitOverpaidError } from '../errors/orders.errors';

export interface LocalOrderSplitPaymentProps {
  id: string;
  splitId: string;
  payerName: string;
  amount: number;
  paidAt: Date;
}

export class LocalOrderSplitPayment {
  private constructor(private readonly props: LocalOrderSplitPaymentProps) {}

  static create(props: LocalOrderSplitPaymentProps): LocalOrderSplitPayment {
    return new LocalOrderSplitPayment({ ...props, payerName: props.payerName.trim() });
  }

  static fromPersistence(props: LocalOrderSplitPaymentProps): LocalOrderSplitPayment {
    return new LocalOrderSplitPayment(props);
  }

  get id(): string {
    return this.props.id;
  }
  get splitId(): string {
    return this.props.splitId;
  }
  get payerName(): string {
    return this.props.payerName;
  }
  get amount(): number {
    return this.props.amount;
  }
  get paidAt(): Date {
    return this.props.paidAt;
  }
}

export interface LocalOrderSplitProps {
  id: string;
  orderId: string;
  shareToken: string;
  expectedTotal: number;
  payments: LocalOrderSplitPayment[];
  createdAt: Date;
  updatedAt: Date;
}

export class LocalOrderSplit {
  private constructor(private readonly props: LocalOrderSplitProps) {}

  static create(
    input: Omit<LocalOrderSplitProps, 'payments'> &
      Partial<Pick<LocalOrderSplitProps, 'payments'>>,
  ): LocalOrderSplit {
    return new LocalOrderSplit({ ...input, payments: [...(input.payments ?? [])] });
  }

  static fromPersistence(props: LocalOrderSplitProps): LocalOrderSplit {
    return new LocalOrderSplit({ ...props, payments: [...props.payments] });
  }

  addPayment(payment: LocalOrderSplitPayment, now = payment.paidAt): void {
    const nextCents = toCents(this.paidTotal) + toCents(payment.amount);
    if (nextCents > toCents(this.expectedTotal)) throw new LocalOrderSplitOverpaidError();
    this.props.payments.push(payment);
    this.props.updatedAt = now;
  }

  get id(): string {
    return this.props.id;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get shareToken(): string {
    return this.props.shareToken;
  }
  get expectedTotal(): number {
    return this.props.expectedTotal;
  }
  get payments(): readonly LocalOrderSplitPayment[] {
    return [...this.props.payments];
  }
  get paidTotal(): number {
    return this.props.payments.reduce((total, payment) => total + toCents(payment.amount), 0) / 100;
  }
  get remainingAmount(): number {
    return Math.max(0, toCents(this.expectedTotal) - toCents(this.paidTotal)) / 100;
  }
  get isPaid(): boolean {
    return toCents(this.paidTotal) === toCents(this.expectedTotal);
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function toCents(value: number): number {
  return Math.round(value * 100);
}
