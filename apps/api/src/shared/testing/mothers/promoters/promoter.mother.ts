import type { Promoter } from '../../../../modules/promoters/domain/entities/promoter.entity';
import { PromoterBuilder } from '../../builders/promoters/promoter.builder';

/** Casos predefinidos de Promoter. */
export const PromoterMother = {
  active: (): Promoter => new PromoterBuilder().build(),
  inactive: (): Promoter => new PromoterBuilder().asInactive().build(),
  suspended: (): Promoter => new PromoterBuilder().asSuspended().build(),
};
