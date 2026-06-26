export type PaymentGateway = 'culqi' | 'izipay' | 'mock';
export type PaymentMethod = 'card' | 'yape' | 'plin';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentProps {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  gatewayReference: string | null;
  amount: number;
  status: PaymentStatus;
  failureReason: string | null;
  confirmedAt: Date | null;
}

/** Pago de una orden (§4.1). MVP: gateway mock. */
export class Payment {
  private constructor(private readonly props: PaymentProps) {}

  static initiate(input: {
    id: string;
    orderId: string;
    method: PaymentMethod;
    amount: number;
    gateway?: PaymentGateway;
  }): Payment {
    return new Payment({
      id: input.id,
      orderId: input.orderId,
      gateway: input.gateway ?? 'mock',
      method: input.method,
      gatewayReference: null,
      amount: input.amount,
      status: 'pending',
      failureReason: null,
      confirmedAt: null,
    });
  }

  approve(reference: string): void {
    this.props.status = 'approved';
    this.props.gatewayReference = reference;
    this.props.confirmedAt = new Date();
  }

  reject(reason: string): void {
    this.props.status = 'rejected';
    this.props.failureReason = reason;
  }

  get id(): string {
    return this.props.id;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get gateway(): PaymentGateway {
    return this.props.gateway;
  }
  get method(): PaymentMethod {
    return this.props.method;
  }
  get gatewayReference(): string | null {
    return this.props.gatewayReference;
  }
  get amount(): number {
    return this.props.amount;
  }
  get status(): PaymentStatus {
    return this.props.status;
  }
  get failureReason(): string | null {
    return this.props.failureReason;
  }
}
