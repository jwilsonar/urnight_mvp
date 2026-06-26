import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import {
  PromoterEventNotFoundError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import {
  PROMO_CODE_REPOSITORY,
  type PromoCodeRepository,
} from '../../domain/ports/promo-code.repository';
import {
  PROMOTER_EVENT_REPOSITORY,
  type PromoterEventRepository,
} from '../../domain/ports/promoter-event.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

/**
 * Caso de uso (admin): desasigna un evento de un promotor. Desactiva los códigos
 * de canje aún NO canjeados (los enlaces compartidos dejan de funcionar) y borra
 * la asignación. Los códigos YA canjeados quedan intactos: sus canjes/entradas se
 * conservan (la FK promo_code.promoter_event_id pasa a NULL por ON DELETE SET NULL).
 */
@Injectable()
export class UnassignEventUseCase {
  private readonly log = createLogger(UnassignEventUseCase.name);

  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_EVENT_REPOSITORY) private readonly promoterEvents: PromoterEventRepository,
    @Inject(PROMO_CODE_REPOSITORY) private readonly promoCodes: PromoCodeRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    promoterId: string;
    promoterEventId: string;
    scope: TenantScope;
  }): Promise<void> {
    const promoter = await this.promoters.findById(input.promoterId);
    if (!promoter) throw new PromoterNotFoundError();
    assertTenant(input.scope, promoter.companyId);

    const header = await this.promoterEvents.findHeader(input.promoterEventId);
    if (!header || header.promoterId !== input.promoterId) {
      throw new PromoterEventNotFoundError();
    }

    await this.uow.run(async (tx) => {
      await this.promoCodes.deactivateUnredeemedByPromoterEvent(input.promoterEventId, tx);
      await this.promoterEvents.deleteByPromoterAndEvent(input.promoterId, header.eventId, tx);
    });

    this.log.info(
      { promoterId: input.promoterId, promoterEventId: input.promoterEventId },
      'promoters.assignment.unassigned',
    );
  }
}
