import { randomUUID } from 'node:crypto';
import {
  SaleAttribution,
  type SaleStatus,
} from '../../../../modules/promoters/domain/entities/sale-attribution.entity';

/** Builder fluido para SaleAttribution. Usa `fromPersistence` para fijar status/monto. */
export class SaleAttributionBuilder {
  private id: string = randomUUID();
  private orderId = 'order-1';
  private promoterId = 'promoter-1';
  private referralLinkId: string | null = 'link-1';
  private commissionRate = 0.05;
  private commissionAmount = 5;
  private status: SaleStatus = 'estimated';
  private attributedAt: Date = new Date('2026-01-01T00:00:00Z');

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withOrderId(orderId: string): this {
    this.orderId = orderId;
    return this;
  }

  withPromoterId(promoterId: string): this {
    this.promoterId = promoterId;
    return this;
  }

  withReferralLinkId(referralLinkId: string | null): this {
    this.referralLinkId = referralLinkId;
    return this;
  }

  withCommissionRate(commissionRate: number): this {
    this.commissionRate = commissionRate;
    return this;
  }

  withCommissionAmount(commissionAmount: number): this {
    this.commissionAmount = commissionAmount;
    return this;
  }

  withStatus(status: SaleStatus): this {
    this.status = status;
    return this;
  }

  withAttributedAt(attributedAt: Date): this {
    this.attributedAt = attributedAt;
    return this;
  }

  build(): SaleAttribution {
    return SaleAttribution.fromPersistence({
      id: this.id,
      orderId: this.orderId,
      promoterId: this.promoterId,
      referralLinkId: this.referralLinkId,
      commissionRate: this.commissionRate,
      commissionAmount: this.commissionAmount,
      status: this.status,
      attributedAt: this.attributedAt,
    });
  }
}
