export type SaleStatus = 'estimated' | 'confirmed' | 'void';

export interface SaleAttributionProps {
  id: string;
  orderId: string;
  promoterId: string;
  referralLinkId: string | null;
  commissionRate: number;
  commissionAmount: number;
  headPromoterId: string | null;
  headCommissionRate: number | null;
  headCommissionAmount: number | null;
  status: SaleStatus;
  attributedAt: Date;
}

/** Atribución de venta a un promotor (§4.1). Sin ventana temporal (ADR 0003). */
export class SaleAttribution {
  private constructor(private readonly props: SaleAttributionProps) {}

  static estimate(input: {
    id: string;
    orderId: string;
    promoterId: string;
    referralLinkId: string | null;
    commissionRate: number;
    amount: number;
    headCommission?: { promoterId: string; rate: number } | null;
  }): SaleAttribution {
    return new SaleAttribution({
      id: input.id,
      orderId: input.orderId,
      promoterId: input.promoterId,
      referralLinkId: input.referralLinkId,
      commissionRate: input.commissionRate,
      commissionAmount: Math.round(input.amount * input.commissionRate * 100) / 100,
      headPromoterId: input.headCommission?.promoterId ?? null,
      headCommissionRate: input.headCommission?.rate ?? null,
      // Es un costo adicional del local: no se resta de la comision del vendedor.
      headCommissionAmount: input.headCommission
        ? Math.round(input.amount * input.headCommission.rate * 100) / 100
        : null,
      status: 'estimated',
      attributedAt: new Date(),
    });
  }

  static fromPersistence(
    props: Omit<
      SaleAttributionProps,
      'headPromoterId' | 'headCommissionRate' | 'headCommissionAmount'
    > &
      Partial<
        Pick<SaleAttributionProps, 'headPromoterId' | 'headCommissionRate' | 'headCommissionAmount'>
      >,
  ): SaleAttribution {
    return new SaleAttribution({
      ...props,
      headPromoterId: props.headPromoterId ?? null,
      headCommissionRate: props.headCommissionRate ?? null,
      headCommissionAmount: props.headCommissionAmount ?? null,
    });
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
  get headPromoterId(): string | null {
    return this.props.headPromoterId;
  }
  get headCommissionRate(): number | null {
    return this.props.headCommissionRate;
  }
  get headCommissionAmount(): number | null {
    return this.props.headCommissionAmount;
  }
  get status(): SaleStatus {
    return this.props.status;
  }
  get attributedAt(): Date {
    return this.props.attributedAt;
  }
}
