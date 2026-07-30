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
import { InsufficientCapacityError } from '../../domain/errors/checkout.errors';
import { CreateTicketHoldUseCase } from './create-ticket-hold.use-case';

const EVENT_ID = '11111111-1111-1111-1111-111111111111';
const TICKET_TYPE_ID = '22222222-2222-2222-2222-222222222222';
const NOW = new Date('2026-07-30T12:00:00.000Z');
const CONSUMER_SCOPE = { isSuperAdmin: false, companyId: null };

function build() {
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

  const useCase = new CreateTicketHoldUseCase(
    holds,
    inventory,
    fakeUnitOfWork(),
    10 * 60 * 1000,
  );
  return { holds, inventory, useCase };
}

describe('CreateTicketHoldUseCase', () => {
  it('reserva el último cupo durante diez minutos', async () => {
    const { holds, useCase } = build();

    const hold = await useCase.execute({
      userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      scope: CONSUMER_SCOPE,
      dto: {
        eventId: EVENT_ID,
        ticketTypeId: TICKET_TYPE_ID,
        quantity: 1,
      },
      now: NOW,
    });

    expect(hold.status).toBe('active');
    expect(hold.expiresAt.toISOString()).toBe('2026-07-30T12:10:00.000Z');
    expect(holds.all).toHaveLength(1);
  });

  it('rechaza un segundo hold cuando el primero ocupa el último cupo', async () => {
    const { useCase } = build();

    await useCase.execute({
      userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      scope: CONSUMER_SCOPE,
      dto: {
        eventId: EVENT_ID,
        ticketTypeId: TICKET_TYPE_ID,
        quantity: 1,
      },
      now: NOW,
    });

    await expect(
      useCase.execute({
        userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        scope: CONSUMER_SCOPE,
        dto: {
          eventId: EVENT_ID,
          ticketTypeId: TICKET_TYPE_ID,
          quantity: 1,
        },
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(InsufficientCapacityError);
  });

  it('ignora un hold vencido al calcular la disponibilidad', async () => {
    const { holds, useCase } = build();
    holds.seedActive({
      id: '33333333-3333-3333-3333-333333333333',
      eventId: EVENT_ID,
      ticketTypeId: TICKET_TYPE_ID,
      userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      quantity: 1,
      expiresAt: new Date('2026-07-30T11:59:59.000Z'),
    });

    const hold = await useCase.execute({
      userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      scope: CONSUMER_SCOPE,
      dto: {
        eventId: EVENT_ID,
        ticketTypeId: TICKET_TYPE_ID,
        quantity: 1,
      },
      now: NOW,
    });

    expect(hold.status).toBe('active');
  });
});
