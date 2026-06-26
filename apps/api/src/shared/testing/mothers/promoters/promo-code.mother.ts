import type { PromoCode } from '../../../../modules/promoters/domain/entities/promo-code.entity';
import { PromoCodeBuilder } from '../../builders/promoters/promo-code.builder';

/** Casos predefinidos de PromoCode. */
export const PromoCodeMother = {
  percentage: (): PromoCode => new PromoCodeBuilder().asPercentage(10).build(),
  fixedAmount: (): PromoCode => new PromoCodeBuilder().asFixedAmount(20).build(),
  inactive: (): PromoCode => new PromoCodeBuilder().asInactive().build(),
  exhausted: (): PromoCode =>
    new PromoCodeBuilder().withUsageQuota(5).withUsedCount(5).build(),
  expired: (): PromoCode =>
    new PromoCodeBuilder()
      .withValidity(new Date('2025-01-01T00:00:00Z'), new Date('2025-12-31T23:59:59Z'))
      .build(),
};
