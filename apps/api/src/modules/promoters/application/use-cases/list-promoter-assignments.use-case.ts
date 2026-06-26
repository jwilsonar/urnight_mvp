import { Inject, Injectable } from '@nestjs/common';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { PromoterNotFoundError } from '../../domain/errors/promoters.errors';
import {
  PROMOTER_EVENT_REPOSITORY,
  type AssignmentView,
  type PromoterEventRepository,
} from '../../domain/ports/promoter-event.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

/** Caso de uso (admin): asignaciones de un promotor de su empresa. */
@Injectable()
export class ListPromoterAssignmentsUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_EVENT_REPOSITORY) private readonly promoterEvents: PromoterEventRepository,
  ) {}

  async execute(input: { promoterId: string; scope: TenantScope }): Promise<AssignmentView[]> {
    const promoter = await this.promoters.findById(input.promoterId);
    if (!promoter) throw new PromoterNotFoundError();
    assertTenant(input.scope, promoter.companyId);
    return this.promoterEvents.listViewsByPromoter(input.promoterId);
  }
}
