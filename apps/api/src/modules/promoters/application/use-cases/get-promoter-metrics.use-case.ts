import { Inject, Injectable } from '@nestjs/common';
import {
  assertTenant,
  type TenantScope,
} from '../../../../shared/tenant/tenant-scope';
import { PromoterNotFoundError } from '../../domain/errors/promoters.errors';
import {
  PROMOTER_ANALYTICS_REPOSITORY,
  type PromoterAnalyticsRepository,
} from '../../domain/ports/promoter-analytics.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';
import {
  calculatePromoterMetrics,
  promoterIdentity,
  type PromoterMetricsView,
} from './promoter-metrics.calculator';

export interface PromoterMetricsFilter {
  eventId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class GetPromoterMetricsUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_ANALYTICS_REPOSITORY)
    private readonly analytics: PromoterAnalyticsRepository,
  ) {}

  async execute(input: {
    promoterId: string;
    scope: TenantScope;
    filter: PromoterMetricsFilter;
  }): Promise<PromoterMetricsView> {
    const promoter = await this.promoters.findById(input.promoterId);
    if (!promoter) throw new PromoterNotFoundError();
    assertTenant(input.scope, promoter.companyId);
    const facts = await this.analytics.listFacts({
      companyId: promoter.companyId,
      ...input.filter,
    });
    return calculatePromoterMetrics(promoterIdentity(promoter), facts);
  }
}

/**
 * El endpoint propio no acepta promoterId: resuelve el promotor activo desde el
 * userId firmado del JWT. Por construcción no puede pedir métricas de un tercero.
 */
@Injectable()
export class GetMyPromoterMetricsUseCase {
  constructor(
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(PROMOTER_ANALYTICS_REPOSITORY)
    private readonly analytics: PromoterAnalyticsRepository,
  ) {}

  async execute(input: {
    actorUserId: string;
    filter: PromoterMetricsFilter;
  }): Promise<PromoterMetricsView> {
    const promoter = await this.promoters.findActiveByUserId(input.actorUserId);
    if (!promoter) throw new PromoterNotFoundError();
    const facts = await this.analytics.listFacts({
      companyId: promoter.companyId,
      ...input.filter,
    });
    return calculatePromoterMetrics(promoterIdentity(promoter), facts);
  }
}
