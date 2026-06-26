import type { SaleAttribution } from '../entities/sale-attribution.entity';

export interface SaleAttributionRepository {
  existsForOrder(orderId: string): Promise<boolean>;
  create(attribution: SaleAttribution): Promise<void>;
  listByPromoter(promoterId: string): Promise<SaleAttribution[]>;
}

export const SALE_ATTRIBUTION_REPOSITORY = Symbol('SALE_ATTRIBUTION_REPOSITORY');
