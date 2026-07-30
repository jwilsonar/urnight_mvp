import { describe, expect, it } from 'vitest';
import {
  InMemoryInventoryRepository,
  InMemoryTicketHoldRepository,
} from '../../../../shared/testing/in-memory/ticketing';
import { SaleEventBuilder } from '../../../../shared/testing/builders/ticketing';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import { ReleaseTicketHoldUseCase } from './release-ticket-hold.use-case';

const EVENT_ID = '11111111-1111-1111-1111-111111111111';
const TICKET_TYPE_ID = '22222222-2222-2222-2222-222222222222';
const HOLD_ID = '33333333-3333-3333-3333-333333333333';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

describe('ReleaseTicketHoldUseCase', () => {
  it('libera explícitamente un hold activo del usuario', async () => {
    const holds = new InMemoryTicketHoldRepository();
    const inventory = new InMemoryInventoryRepository();
    inventory.seedEvent(new SaleEventBuilder().withId(EVENT_ID).build());
    holds.seedActive({
      id: HOLD_ID,
      eventId: EVENT_ID,
      ticketTypeId: TICKET_TYPE_ID,
      userId: USER_ID,
      quantity: 1,
      expiresAt: new Date('2026-07-30T12:10:00.000Z'),
    });
    const useCase = new ReleaseTicketHoldUseCase(
      holds,
      inventory,
      fakeUnitOfWork(),
    );

    const released = await useCase.execute({
      holdId: HOLD_ID,
      userId: USER_ID,
      scope: { isSuperAdmin: false, companyId: null },
      now: new Date('2026-07-30T12:00:00.000Z'),
    });

    expect(released.status).toBe('released');
  });
});
