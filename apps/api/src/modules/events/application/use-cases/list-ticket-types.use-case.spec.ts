import { describe, expect, it } from 'vitest';
import { InMemoryTicketTypeRepository } from '../../../../shared/testing/in-memory/events';
import { TicketTypeBuilder } from '../../../../shared/testing/builders/events';
import { ListTicketTypesUseCase } from './list-ticket-types.use-case';

function build() {
  const ticketTypes = new InMemoryTicketTypeRepository();
  const useCase = new ListTicketTypesUseCase(ticketTypes);
  return { ticketTypes, useCase };
}

describe('ListTicketTypesUseCase', () => {
  it('devuelve los tipos de entrada del evento solicitado', async () => {
    const { ticketTypes, useCase } = build();
    await ticketTypes.create(new TicketTypeBuilder().withId('t1').withEventId('e1').build());
    await ticketTypes.create(new TicketTypeBuilder().withId('t2').withEventId('e1').build());
    await ticketTypes.create(new TicketTypeBuilder().withId('t3').withEventId('e2').build());

    const result = await useCase.execute('e1');

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(['t1', 't2']);
  });

  it('devuelve lista vacía cuando el evento no tiene tipos de entrada', async () => {
    const { useCase } = build();
    const result = await useCase.execute('e1');
    expect(result).toHaveLength(0);
  });
});
