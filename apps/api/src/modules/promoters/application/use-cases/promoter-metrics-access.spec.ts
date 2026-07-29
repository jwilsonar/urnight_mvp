import { describe, expect, it } from 'vitest';
import { TenantForbiddenError } from '../../../../shared/errors/tenant-forbidden.error';
import { InMemoryPromoterRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoterBuilder } from '../../../../shared/testing/builders/promoters';
import type {
  PromoterAnalyticsFacts,
  PromoterAnalyticsFilter,
  PromoterAnalyticsRepository,
} from '../../domain/ports/promoter-analytics.repository';
import {
  GetMyPromoterMetricsUseCase,
  GetPromoterMetricsUseCase,
} from './get-promoter-metrics.use-case';
import { ListPromoterRankingUseCase } from './list-promoter-ranking.use-case';

class InMemoryAnalyticsRepository implements PromoterAnalyticsRepository {
  constructor(
    private readonly byCompany: Record<string, PromoterAnalyticsFacts>,
  ) {}

  async listFacts(
    filter: PromoterAnalyticsFilter,
  ): Promise<PromoterAnalyticsFacts> {
    const empty = { assignments: [], attributions: [], tickets: [] };
    if (filter.companyId === null) {
      return Object.values(this.byCompany).reduce<PromoterAnalyticsFacts>(
        (all, facts) => ({
          assignments: [...all.assignments, ...facts.assignments],
          attributions: [...all.attributions, ...facts.attributions],
          tickets: [...all.tickets, ...facts.tickets],
        }),
        empty,
      );
    }
    return this.byCompany[filter.companyId] ?? empty;
  }
}

const emptyFacts: PromoterAnalyticsFacts = {
  assignments: [],
  attributions: [],
  tickets: [],
};

describe('acceso a métricas de promotor', () => {
  it('un promotor obtiene solo el perfil ligado a su usuario, sin aceptar promoterId ajeno', async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(
      new PromoterBuilder()
        .withId('11111111-1111-1111-1111-111111111111')
        .withCompanyId('company-1')
        .withUserId('user-1')
        .build(),
    );
    promoters.seed(
      new PromoterBuilder()
        .withId('22222222-2222-2222-2222-222222222222')
        .withCompanyId('company-1')
        .withUserId('user-2')
        .build(),
    );
    const useCase = new GetMyPromoterMetricsUseCase(
      promoters,
      new InMemoryAnalyticsRepository({ 'company-1': emptyFacts }),
    );

    const result = await useCase.execute({ actorUserId: 'user-1', filter: {} });

    expect(result.promoterId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('un admin no puede leer el detalle de un promotor de otra compañía', async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(
      new PromoterBuilder()
        .withId('22222222-2222-2222-2222-222222222222')
        .withCompanyId('company-2')
        .build(),
    );
    const useCase = new GetPromoterMetricsUseCase(
      promoters,
      new InMemoryAnalyticsRepository({ 'company-2': emptyFacts }),
    );

    await expect(
      useCase.execute({
        promoterId: '22222222-2222-2222-2222-222222222222',
        scope: { isSuperAdmin: false, companyId: 'company-1' },
        filter: {},
      }),
    ).rejects.toBeInstanceOf(TenantForbiddenError);
  });

  it('el ranking de admin contiene solo promotores de su compañía', async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(
      new PromoterBuilder()
        .withId('11111111-1111-1111-1111-111111111111')
        .withCompanyId('company-1')
        .build(),
    );
    promoters.seed(
      new PromoterBuilder()
        .withId('22222222-2222-2222-2222-222222222222')
        .withCompanyId('company-2')
        .build(),
    );
    const useCase = new ListPromoterRankingUseCase(
      promoters,
      new InMemoryAnalyticsRepository({
        'company-1': emptyFacts,
        'company-2': emptyFacts,
      }),
    );

    const result = await useCase.execute({
      scope: { isSuperAdmin: false, companyId: 'company-1' },
      filter: {},
      sortBy: 'sales',
      order: 'desc',
    });

    expect(result.rows.map((row) => row.promoterId)).toEqual([
      '11111111-1111-1111-1111-111111111111',
    ]);
  });
});
