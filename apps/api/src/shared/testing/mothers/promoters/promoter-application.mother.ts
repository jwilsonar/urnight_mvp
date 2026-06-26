import type { PromoterApplication } from '../../../../modules/promoters/domain/entities/promoter-application.entity';
import { PromoterApplicationBuilder } from '../../builders/promoters/promoter-application.builder';

/** Casos predefinidos de PromoterApplication. */
export const PromoterApplicationMother = {
  pending: (): PromoterApplication => new PromoterApplicationBuilder().build(),
  approved: (): PromoterApplication => new PromoterApplicationBuilder().asApproved().build(),
  rejected: (): PromoterApplication => new PromoterApplicationBuilder().asRejected().build(),
};
