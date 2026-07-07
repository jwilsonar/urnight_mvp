import { describe, expect, it } from 'vitest';
import type { GenerateRedemptionCodeDto } from '@urnight/contracts';
import { InMemoryPromoCodeRepository, InMemoryPromoterRepository } from '../../../../shared/testing/in-memory/promoters';
import { PromoterBuilder } from '../../../../shared/testing/builders/promoters';
import {
  AllocationExhaustedError,
  AllocationNotFoundError,
  AssignmentForbiddenError,
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
import { GenerateRedemptionCodeUseCase } from './generate-my-code.use-case';

const PE = 'pe-1';
const EVENT = '22222222-2222-2222-2222-222222222222';
const TT = '11111111-1111-1111-1111-111111111111';

class FakePromoterEventRepo implements PromoterEventRepository {
  constructor(
    private header: PromoterEventHeader | null,
    private allocation: AllocationSnapshot | null,
  ) {}
  async create(): Promise<void> {}
  async deleteByPromoterAndEvent(): Promise<void> {}
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
    return this.allocation;
  }
}

const alloc = (remaining: number): AllocationSnapshot => ({
  promoterEventId: PE,
  eventId: EVENT,
  ticketTypeId: TT,
  discountType: 'percentage',
  discountValue: 100,
  allocatedStock: 10,
  usedStock: 10 - remaining,
  remaining,
});

const activeHeader: PromoterEventHeader = { id: PE, promoterId: 'p1', eventId: EVENT, status: 'active' };
const dto: GenerateRedemptionCodeDto = { promoterEventId: PE, ticketTypeId: TT };

function build(header: PromoterEventHeader | null, allocation: AllocationSnapshot | null) {
  const promoters = new InMemoryPromoterRepository();
  const promoCodes = new InMemoryPromoCodeRepository();
  const useCase = new GenerateRedemptionCodeUseCase(
    promoters,
    new FakePromoterEventRepo(header, allocation),
    promoCodes,
  );
  return { promoters, promoCodes, useCase };
}

const seedPromoter = (promoters: InMemoryPromoterRepository) =>
  promoters.seed(new PromoterBuilder().withId('p1').withUserId('user-1').withStatus('active').build());

describe('GenerateRedemptionCodeUseCase', () => {
  it('genera un código single-use para la asignación con cupo disponible', async () => {
    const { promoters, promoCodes, useCase } = build(activeHeader, alloc(5));
    seedPromoter(promoters);

    const view = await useCase.execute({ userId: 'user-1', dto });

    expect(view.code).toMatch(/.+/);
    expect(view.ticketTypeId).toBe(TT);
    expect(view.usageQuota).toBe(1);
    expect(await promoCodes.existsByCode(view.code)).toBe(true);
  });

  it('usuario sin promotor activo → PromoterNotFoundError', async () => {
    const { useCase } = build(activeHeader, alloc(5));
    await expect(useCase.execute({ userId: 'sin-promotor', dto })).rejects.toBeInstanceOf(
      PromoterNotFoundError,
    );
  });

  it('asignación revocada → PromoterEventNotFoundError', async () => {
    const { promoters, useCase } = build({ ...activeHeader, status: 'revoked' }, alloc(5));
    seedPromoter(promoters);
    await expect(useCase.execute({ userId: 'user-1', dto })).rejects.toBeInstanceOf(
      PromoterEventNotFoundError,
    );
  });

  it('asignación de otro promotor → AssignmentForbiddenError', async () => {
    const { promoters, useCase } = build({ ...activeHeader, promoterId: 'otro' }, alloc(5));
    seedPromoter(promoters);
    await expect(useCase.execute({ userId: 'user-1', dto })).rejects.toBeInstanceOf(
      AssignmentForbiddenError,
    );
  });

  it('tipo de entrada sin allocation → AllocationNotFoundError', async () => {
    const { promoters, useCase } = build(activeHeader, null);
    seedPromoter(promoters);
    await expect(useCase.execute({ userId: 'user-1', dto })).rejects.toBeInstanceOf(
      AllocationNotFoundError,
    );
  });

  it('cupo agotado (remaining 0) → AllocationExhaustedError', async () => {
    const { promoters, useCase } = build(activeHeader, alloc(0));
    seedPromoter(promoters);
    await expect(useCase.execute({ userId: 'user-1', dto })).rejects.toBeInstanceOf(
      AllocationExhaustedError,
    );
  });
});
