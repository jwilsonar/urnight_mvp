import { describe, expect, it } from 'vitest';
import type { AssignEventDto } from '@urnight/contracts';
import { InMemoryPromoterRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoterBuilder } from '../../../../shared/testing/builders/promoters';
import { FakeResourceTenant, scopeForCompany } from '../../../../shared/testing/fakes';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes/fake-unit-of-work';
import { PromoterEvent } from '../../domain/entities/promoter-event.entity';
import {
  AllocationExceedsStockError,
  AssignmentForbiddenError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import type {
  AllocationSnapshot,
  AssignmentView,
  PromoterEventHeader,
  PromoterEventRepository,
  TicketStock,
} from '../../domain/ports/promoter-event.repository';
import { AssignEventToPromoterUseCase } from './assign-event-to-promoter.use-case';

/** Fake mínimo de PromoterEventRepository para probar la asignación (upsert). */
class FakePromoterEventRepo implements PromoterEventRepository {
  readonly created: PromoterEvent[] = [];
  private stocks: TicketStock[] = [];

  withStocks(stocks: TicketStock[]): this {
    this.stocks = stocks;
    return this;
  }

  async create(agg: PromoterEvent): Promise<void> {
    this.created.push(agg);
  }
  async deleteByPromoterAndEvent(): Promise<void> {}
  async findIdByPromoterAndEvent(): Promise<string | null> {
    return null;
  }
  async replaceAllocations(): Promise<void> {}
  async listTicketStocks(): Promise<TicketStock[]> {
    return this.stocks;
  }
  async findHeader(): Promise<PromoterEventHeader | null> {
    return null;
  }
  async listViewsByPromoter(): Promise<AssignmentView[]> {
    return [];
  }
  async findView(promoterEventId: string): Promise<AssignmentView | null> {
    const agg = this.created.find((a) => a.id === promoterEventId);
    if (!agg) return null;
    return {
      id: agg.id,
      promoterId: agg.promoterId,
      eventId: agg.eventId,
      status: agg.status,
      event: { id: agg.eventId, slug: 'ev', name: 'Evento', startsAt: new Date(), flyerUrl: null },
      items: agg.allocations.map((a) => ({
        ticketTypeId: a.ticketTypeId,
        ticketTypeName: 'General',
        price: 100,
        currency: 'PEN',
        discountType: a.discountType,
        discountValue: a.discountValue,
        allocatedStock: a.allocatedStock,
        usedStock: 0,
        remaining: a.allocatedStock,
      })),
      createdAt: agg.createdAt,
    };
  }
  async getAllocation(): Promise<AllocationSnapshot | null> {
    return null;
  }
}

const TT = '11111111-1111-1111-1111-111111111111';
const EVENT = '22222222-2222-2222-2222-222222222222';

const dto: AssignEventDto = {
  eventId: EVENT,
  items: [{ ticketTypeId: TT, discountType: 'percentage', discountValue: 100, allocatedStock: 10 }],
};

function build(companyId = 'c1') {
  const promoters = new InMemoryPromoterRepository();
  const promoterEvents = new FakePromoterEventRepo().withStocks([{ ticketTypeId: TT, remaining: 20 }]);
  const useCase = new AssignEventToPromoterUseCase(
    promoters,
    promoterEvents,
    new FakeResourceTenant(companyId),
    fakeUnitOfWork(),
  );
  return { promoters, promoterEvents, useCase };
}

describe('AssignEventToPromoterUseCase', () => {
  it('asigna un evento a un promotor activo de la empresa y devuelve la vista', async () => {
    const { promoters, promoterEvents, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').build());

    const view = await useCase.execute({
      promoterId: 'p1',
      assignedBy: 'admin-1',
      dto,
      scope: scopeForCompany('c1'),
    });

    expect(view.promoterId).toBe('p1');
    expect(view.items).toHaveLength(1);
    expect(view.items[0]?.allocatedStock).toBe(10);
    expect(promoterEvents.created).toHaveLength(1);
  });

  it('promotor inexistente → PromoterNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ promoterId: 'ghost', assignedBy: 'a', dto, scope: scopeForCompany('c1') }),
    ).rejects.toBeInstanceOf(PromoterNotFoundError);
  });

  it('promotor de otra empresa → TenantForbiddenError (aislamiento)', async () => {
    const { promoters, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').build());

    await expect(
      useCase.execute({ promoterId: 'p1', assignedBy: 'a', dto, scope: scopeForCompany('otra') }),
    ).rejects.toThrow();
  });

  it('promotor no activo → AssignmentForbiddenError', async () => {
    const { promoters, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').asInactive().build());

    await expect(
      useCase.execute({ promoterId: 'p1', assignedBy: 'a', dto, scope: scopeForCompany('c1') }),
    ).rejects.toBeInstanceOf(AssignmentForbiddenError);
  });

  it('cupo mayor al stock disponible → AllocationExceedsStockError', async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').build());
    const promoterEvents = new FakePromoterEventRepo().withStocks([{ ticketTypeId: TT, remaining: 3 }]);
    const useCase = new AssignEventToPromoterUseCase(
      promoters,
      promoterEvents,
      new FakeResourceTenant('c1'),
      fakeUnitOfWork(),
    );

    await expect(
      useCase.execute({ promoterId: 'p1', assignedBy: 'a', dto, scope: scopeForCompany('c1') }),
    ).rejects.toBeInstanceOf(AllocationExceedsStockError);
  });

  it('tipo de entrada ajeno al evento → AssignmentForbiddenError', async () => {
    const promoters = new InMemoryPromoterRepository();
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').build());
    const promoterEvents = new FakePromoterEventRepo().withStocks([]); // sin stocks para ese tipo
    const useCase = new AssignEventToPromoterUseCase(
      promoters,
      promoterEvents,
      new FakeResourceTenant('c1'),
      fakeUnitOfWork(),
    );

    await expect(
      useCase.execute({ promoterId: 'p1', assignedBy: 'a', dto, scope: scopeForCompany('c1') }),
    ).rejects.toBeInstanceOf(AssignmentForbiddenError);
  });
});
