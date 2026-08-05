import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { saleAttribution } from '@urnight/db';
import { DRIZZLE, type DrizzleDb } from '../../../../shared/database/drizzle.constants';
import { SaleAttribution, type SaleStatus } from '../../domain/entities/sale-attribution.entity';
import type { SaleAttributionRepository } from '../../domain/ports/sale-attribution.repository';

type Row = typeof saleAttribution.$inferSelect;

@Injectable()
export class DrizzleSaleAttributionRepository implements SaleAttributionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async existsForOrder(orderId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: saleAttribution.id })
      .from(saleAttribution)
      .where(eq(saleAttribution.orderId, orderId))
      .limit(1);
    return Boolean(row);
  }

  async create(entity: SaleAttribution): Promise<void> {
    await this.db.insert(saleAttribution).values({
      id: entity.id,
      orderId: entity.orderId,
      promoterId: entity.promoterId,
      referralLinkId: entity.referralLinkId,
      commissionRate: entity.commissionRate.toFixed(4),
      commissionAmount: entity.commissionAmount.toFixed(2),
      headPromoterId: entity.headPromoterId,
      headCommissionRate: entity.headCommissionRate?.toFixed(4) ?? null,
      headCommissionAmount: entity.headCommissionAmount?.toFixed(2) ?? null,
      status: entity.status,
    });
  }

  async listByPromoter(promoterId: string): Promise<SaleAttribution[]> {
    const rows = await this.db
      .select()
      .from(saleAttribution)
      .where(eq(saleAttribution.promoterId, promoterId))
      .orderBy(desc(saleAttribution.attributedAt));
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: Row): SaleAttribution {
    return SaleAttribution.fromPersistence({
      id: row.id,
      orderId: row.orderId,
      promoterId: row.promoterId,
      referralLinkId: row.referralLinkId,
      commissionRate: Number(row.commissionRate),
      commissionAmount: Number(row.commissionAmount),
      headPromoterId: row.headPromoterId,
      headCommissionRate: row.headCommissionRate === null ? null : Number(row.headCommissionRate),
      headCommissionAmount:
        row.headCommissionAmount === null ? null : Number(row.headCommissionAmount),
      status: row.status as SaleStatus,
      attributedAt: row.attributedAt,
    });
  }
}
