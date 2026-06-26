import { Inject, Injectable } from '@nestjs/common';
import { TenantForbiddenError } from '../../../../shared/errors/tenant-forbidden.error';
import type { SaleAttribution } from '../../domain/entities/sale-attribution.entity';
import { PromoterNotFoundError } from '../../domain/errors/promoters.errors';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';
import {
  SALE_ATTRIBUTION_REPOSITORY,
  type SaleAttributionRepository,
} from '../../domain/ports/sale-attribution.repository';

export interface PromoterSales {
  promoterId: string;
  attributions: SaleAttribution[];
  totalCommission: number;
}

/** Caso de uso: resumen de ventas/comisiones de un promotor. */
@Injectable()
export class ListPromoterSalesUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(SALE_ATTRIBUTION_REPOSITORY)
    private readonly attributions: SaleAttributionRepository,
  ) {}

  async execute(input: {
    promoterId: string;
    actorUserId: string;
    isSuperAdmin: boolean;
  }): Promise<PromoterSales> {
    const promoter = await this.promoters.findById(input.promoterId);
    if (!promoter) throw new PromoterNotFoundError();
    // Un promotor solo ve SUS propias ventas/comisiones (super_admin ve todas).
    if (!input.isSuperAdmin && promoter.userId !== input.actorUserId) {
      throw new TenantForbiddenError();
    }
    const promoterId = input.promoterId;
    const attributions = await this.attributions.listByPromoter(promoterId);
    const totalCommission =
      Math.round(attributions.reduce((acc, a) => acc + a.commissionAmount, 0) * 100) / 100;
    return { promoterId, attributions, totalCommission };
  }
}
