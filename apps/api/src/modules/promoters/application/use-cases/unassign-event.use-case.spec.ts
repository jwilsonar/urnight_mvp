import { describe, expect, it } from 'vitest';
import { InMemoryPromoCodeRepository, InMemoryPromoterRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoterBuilder } from '../../../../shared/testing/builders/promoters';
import { scopeForCompany } from '../../../../shared/testing/fakes';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes/fake-unit-of-work';
import {
  PromoterEventNotFoundError,
  PromoterNotFoundError,
} from '../../domain/errors/promoters.errors';
import type {
  AllocationSnapshot,
  AssignmentView,
  PromoterEventHeader,
  PromoterEventRepository,
  TicketStock,
} from '../../domain/ports/promoter-event.repository';
import { UnassignEventUseCase } from './unassign-event.use-case';

class FakePromoterEventRepo implements PromoterEventRepository {
  deleted = 0;
  constructor(private header: PromoterEventHeader | null) {}
  async create(): Promise<void> {}
  async deleteByPromoterAndEvent(): Promise<void> {
    this.deleted += 1;
  }
  async findIdByPromoterAndEvent(): Promise<string | null> {
    return null;
  }
  async replaceAllocations(): Promise<void> {}
  async listTicketStocks(): Promise<TicketStock[]> {
    return [];
  }
  async findHeader(): Promise<PromoterEventHeader | null> {
    return this.header;
  }
  async listViewsByPromoter(): Promise<AssignmentView[]> {
    return [];
  }
  async findView(): Promise<AssignmentView | null> {
    return null;
  }
  async getAllocation(): Promise<AllocationSnapshot | null> {
    return null;
  }
}

const PE = 'pe-1';
const EVENT = '22222222-2222-2222-2222-222222222222';
const TT = '11111111-1111-1111-1111-111111111111';

function build(header: PromoterEventHeader | null = { id: PE, promoterId: 'p1', eventId: EVENT, status: 'active' }) {
  const promoters = new InMemoryPromoterRepository();
  const promoCodes = new InMemoryPromoCodeRepository();
  const promoterEvents = new FakePromoterEventRepo(header);
  const useCase = new UnassignEventUseCase(promoters, promoterEvents, promoCodes, fakeUnitOfWork());
  return { promoters, promoCodes, promoterEvents, useCase };
}

describe('UnassignEventUseCase', () => {
  it('desasigna: desactiva códigos NO canjeados y borra la asignación', async () => {
    const { promoters, promoCodes, promoterEvents, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').build());
    await promoCodes.createGenerated({
      id: 'code-1',
      code: 'FREE01',
      discountType: 'percentage',
      discountValue: 100,
      eventId: EVENT,
      ticketTypeId: TT,
      promoterId: 'p1',
      promoterEventId: PE,
      createdBy: 'p1',
    });
    expect(await promoCodes.countByAllocation(PE, TT)).toBe(1);

    await useCase.execute({ promoterId: 'p1', promoterEventId: PE, scope: scopeForCompany('c1') });

    expect(promoterEvents.deleted).toBe(1);
    expect(await promoCodes.countByAllocation(PE, TT)).toBe(0); // desactivado
  });

  it('promotor inexistente → PromoterNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ promoterId: 'ghost', promoterEventId: PE, scope: scopeForCompany('c1') }),
    ).rejects.toBeInstanceOf(PromoterNotFoundError);
  });

  it('promotor de otra empresa → TenantForbiddenError', async () => {
    const { promoters, useCase } = build();
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').build());

    await expect(
      useCase.execute({ promoterId: 'p1', promoterEventId: PE, scope: scopeForCompany('otra') }),
    ).rejects.toThrow();
  });

  it('asignación inexistente → PromoterEventNotFoundError', async () => {
    const { promoters, useCase } = build(null);
    promoters.seed(new PromoterBuilder().withId('p1').withCompanyId('c1').build());

    await expect(
      useCase.execute({ promoterId: 'p1', promoterEventId: PE, scope: scopeForCompany('c1') }),
    ).rejects.toBeInstanceOf(PromoterEventNotFoundError);
  });
});
