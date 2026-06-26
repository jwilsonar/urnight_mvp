import { describe, expect, it } from 'vitest';
import { AttendeeBuilder, TicketBuilder } from '../../../../shared/testing/builders/ticketing';
import { InMemoryTicketRepository } from '../../../../shared/testing/in-memory/ticketing';
import { ListMyTicketsUseCase } from './list-my-tickets.use-case';

function build() {
  const tickets = new InMemoryTicketRepository();
  const useCase = new ListMyTicketsUseCase(tickets);
  return { useCase, tickets };
}

describe('ListMyTicketsUseCase', () => {
  it('devuelve las entradas del usuario con el nombre del asistente', async () => {
    const { useCase, tickets } = build();
    tickets.seed(
      'user-1',
      new TicketBuilder().withId('t1').withQr('qr-1').build(),
      new AttendeeBuilder().withFullName('Ada Lovelace').build(),
    );

    const result = await useCase.execute('user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.attendeeName).toBe('Ada Lovelace');
    expect(result[0]?.ticket.id).toBe('t1');
  });

  it('no devuelve las entradas de otros usuarios', async () => {
    const { useCase, tickets } = build();
    tickets.seed(
      'otro',
      new TicketBuilder().withId('t1').withQr('qr-1').build(),
      new AttendeeBuilder().build(),
    );
    const result = await useCase.execute('user-1');
    expect(result).toHaveLength(0);
  });
});
