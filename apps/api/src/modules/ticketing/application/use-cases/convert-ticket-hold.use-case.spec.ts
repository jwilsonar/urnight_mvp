import { describe, expect, it } from 'vitest';
import {
  InMemoryInventoryRepository,
  InMemoryTicketHoldRepository,
} from '../../../../shared/testing/in-memory/ticketing';
import {
  SaleEventBuilder,
  SaleTicketTypeBuilder,
} from '../../../../shared/testing/builders/ticketing';
import { fakeUnitOfWork } from '../../../../shared/testing/fakes';
import { HoldExpiredError } from '../../domain/errors/checkout.errors';
import { ConvertTicketHoldUseCase } from './convert-ticket-hold.use-case';

const EVENT_ID = '11111111-1111-1111-1111-111111111111';
const TICKET_TYPE_ID = '22222222-2222-2222-2222-222222222222';
const HOLD_ID = '33333333-3333-3333-3333-333333333333';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORDER_ID = '44444444-4444-4444-4444-444444444444';
const NOW = new Date('2026-07-30T12:00:00.000Z');
const CONSUMER_SCOPE = { isSuperAdmin: false, companyId: null };

function build(expiresAt = new Date('2026-07-30T12:10:00.000Z')) {
  const holds = new InMemoryTicketHoldRepository();
  const inventory = new InMemoryInventoryRepository();
  inventory.seedEvent(new SaleEventBuilder().withId(EVENT_ID).build());
  inventory.seedTicketType(
    new SaleTicketTypeBuilder()
      .withId(TICKET_TYPE_ID)
      .withEvent(EVENT_ID)
      .withStock(1)
      .build(),
  );
  holds.seedCapacity(TICKET_TYPE_ID, { stock: 1, sold: 0 });
  holds.seedActive({
    id: HOLD_ID,
    eventId: EVENT_ID,
    ticketTypeId: TICKET_TYPE_ID,
    userId: USER_ID,
    quantity: 1,
    expiresAt,
  });

  const useCase = new ConvertTicketHoldUseCase(
    holds,
    inventory,
    fakeUnitOfWork(),
  );
  return { holds, inventory, useCase };
}

describe('ConvertTicketHoldUseCase', () => {
  it('convierte el hold y consume el cupo exactamente una vez ante reintentos', async () => {
    const { holds, inventory, useCase } = build();
    const input = {
      holdId: HOLD_ID,
      orderId: ORDER_ID,
      userId: USER_ID,
      scope: CONSUMER_SCOPE,
      now: NOW,
    };

    const first = await useCase.execute(input);
    const repeated = await useCase.execute(input);

    expect(first.status).toBe('converted');
    expect(repeated.status).toBe('converted');
    expect(repeated.orderId).toBe(ORDER_ID);
    expect(inventory.soldOf(TICKET_TYPE_ID)).toBe(1);
    expect(inventory.countersOf(EVENT_ID).ticketsSold).toBe(1);
    expect(holds.byId(HOLD_ID)?.status).toBe('converted');
  });

  it('no consume cupo cuando el hold ya venció', async () => {
    const { inventory, useCase } = build(
      new Date('2026-07-30T11:59:59.000Z'),
    );

    await expect(
      useCase.execute({
        holdId: HOLD_ID,
        orderId: ORDER_ID,
        userId: USER_ID,
        scope: CONSUMER_SCOPE,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(HoldExpiredError);
    expect(inventory.soldOf(TICKET_TYPE_ID)).toBe(0);
  });
});
