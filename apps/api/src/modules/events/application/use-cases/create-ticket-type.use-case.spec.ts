import type { CreateTicketTypeDto } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import {
  InMemoryEventRepository,
  InMemoryTicketTypeRepository,
} from '../../../../shared/testing/in-memory/events';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { FakeEventTenant, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { CreateTicketTypeUseCase } from './create-ticket-type.use-case';

function build() {
  const events = new InMemoryEventRepository();
  const ticketTypes = new InMemoryTicketTypeRepository();
  const useCase = new CreateTicketTypeUseCase(events, new FakeEventTenant(), ticketTypes);
  return { events, ticketTypes, useCase };
}

function dto(overrides: Partial<CreateTicketTypeDto> = {}): CreateTicketTypeDto {
  return {
    eventId: 'e1',
    name: 'General',
    tierCode: 'general',
    price: 50,
    currency: 'PEN',
    stock: 100,
    ...overrides,
  } as CreateTicketTypeDto;
}

describe('CreateTicketTypeUseCase', () => {
  it('crea un tipo de entrada activo y lo persiste', async () => {
    const { events, ticketTypes, useCase } = build();
    await events.create(new EventBuilder().withId('e1').build());

    const result = await useCase.execute({ dto: dto(), scope: SUPER_ADMIN_SCOPE });

    expect(result.eventId).toBe('e1');
    expect(result.name).toBe('General');
    expect(result.tierCode).toBe('general');
    expect(result.stock).toBe(100);
    expect(result.sold).toBe(0);
    expect(result.status).toBe('active');
    expect(ticketTypes.size).toBe(1);
    expect(ticketTypes.all[0]?.eventId).toBe('e1');
  });

  it('mapea las fechas de venta y maxPerUser del DTO', async () => {
    const { events, useCase } = build();
    await events.create(new EventBuilder().withId('e1').build());

    const result = await useCase.execute({
      dto: dto({
        tierCode: 'vip',
        maxPerUser: 4,
        saleStartsAt: '2026-11-01T00:00:00.000Z',
        saleEndsAt: '2026-12-31T00:00:00.000Z',
      }),
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.tierCode).toBe('vip');
    expect(result.maxPerUser).toBe(4);
  });

  it('evento inexistente → EventNotFoundError', async () => {
    const { ticketTypes, useCase } = build();

    await expect(
      useCase.execute({ dto: dto({ eventId: 'ghost' }), scope: SUPER_ADMIN_SCOPE }),
    ).rejects.toBeInstanceOf(EventNotFoundError);
    expect(ticketTypes.size).toBe(0);
  });
});
