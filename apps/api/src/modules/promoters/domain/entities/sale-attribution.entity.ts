export type SaleStatus = 'estimated' | 'confirmed' | 'void';

export interface SaleAttributionProps {
  id: string;
  orderId: string;
  promoterId: string;
  referralLinkId: string | null;
  commissionRate: number;
  commissionAmount: number;
  status: SaleStatus;
  attributedAt: Date;
}

/** Atribución de venta a un promotor (§4.1, ventana 7 días). */
export class SaleAttribution {
  private constructor(private readonly props: SaleAttributionProps) {}

  static estimate(input: {
    id: string;
    orderId: string;
    promoterId: string;
    referralLinkId: string | null;
    commissionRate: number;
    amount: number;
  }): SaleAttribution {
    return new SaleAttribution({
      id: input.id,
      orderId: input.orderId,
      promoterId: input.promoterId,
      referralLinkId: input.referralLinkId,
      commissionRate: input.commissionRate,
      commissionAmount: Math.round(input.amount * input.commissionRate * 100) / 100,
      status: 'estimated',
      attributedAt: new Date(),
    });
  }

  static fromPersistence(props: SaleAttributionProps): SaleAttribution {
    return new SaleAttribution(props);
  }

  get id(): string {
    return this.props.id;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get promoterId(): string {
    return this.props.promoterId;
  }
  get referralLinkId(): string | null {
    return this.props.referralLinkId;
  }
  get commissionRate(): number {
    return this.props.commissionRate;
  }
  get commissionAmount(): number {
    return this.props.commissionAmount;
  }
  get status(): SaleStatus {
    return this.props.status;
  }
  get attributedAt(): Date {
    return this.props.attributedAt;
  }
}
