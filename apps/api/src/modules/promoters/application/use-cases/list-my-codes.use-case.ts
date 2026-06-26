import { Inject, Injectable } from '@nestjs/common';
import {
  AssignmentForbiddenError,
  PromoterEventNotFoundError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
  type RedemptionCodeView,
} from '../../domain/ports/promo-code.repository';
import {
  PROMOTER_EVENT_REPOSITORY,
  type PromoterEventRepository,
} from '../../domain/ports/promoter-event.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

/** Caso de uso (promotor): códigos generados para una de sus asignaciones. */
@Injectable()
export class ListMyRedemptionCodesUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_EVENT_REPOSITORY) private readonly promoterEvents: PromoterEventRepository,
    @Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository,
  ) {}

  async execute(input: { userId: string; promoterEventId: string }): Promise<RedemptionCodeView[]> {
    const promoter = await this.promoters.findActiveByUserId(input.userId);
    if (!promoter) throw new PromoterNotFoundError();
    const header = await this.promoterEvents.findHeader(input.promoterEventId);
    if (!header) throw new PromoterEventNotFoundError();
    if (header.promoterId !== promoter.id) throw new AssignmentForbiddenError();
    return this.promoCodes.listByPromoterEvent(input.promoterEventId);
  }
}
