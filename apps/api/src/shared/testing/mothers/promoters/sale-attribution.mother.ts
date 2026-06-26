import type { SaleAttribution } from '../../../../modules/promoters/domain/entities/sale-attribution.entity';
import { SaleAttributionBuilder } from '../../builders/promoters/sale-attribution.builder';

/** Casos predefinidos de SaleAttribution. */
export const SaleAttributionMother = {
  estimated: (): SaleAttribution => new SaleAttributionBuilder().build(),
  confirmed: (): SaleAttribution => new SaleAttributionBuilder().withStatus('confirmed').build(),
  voided: (): SaleAttribution => new SaleAttributionBuilder().withStatus('void').build(),
};
