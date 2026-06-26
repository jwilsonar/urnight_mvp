import { Inject, Injectable } from '@nestjs/common';
import {
  PROMOTER_EVENT_REPOSITORY,
  type AssignmentView,
  type PromoterEventRepository,
} from '../../domain/ports/promoter-event.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';

/** Caso de uso (promotor): los eventos que le fueron asignados a promocionar. */
@Injectable()
export class ListMyAssignmentsUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_EVENT_REPOSITORY) private readonly promoterEvents: PromoterEventRepository,
  ) {}

  async execute(userId: string): Promise<AssignmentView[]> {
    const promoter = await this.promoters.findActiveByUserId(userId);
    if (!promoter) return [];
    return this.promoterEvents.listViewsByPromoter(promoter.id);
  }
}
