import type { ResolveSupportTicketDto } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { InMemorySupportTicketRepository } from '../../../../shared/testing/in-memory/ops';
import { SupportTicketBuilder } from '../../../../shared/testing/builders/ops';
import { SupportTicketNotFoundError } from '../../domain/errors/ops.errors';
import { ResolveSupportTicketUseCase } from './resolve-support-ticket.use-case';

function build() {
  const tickets = new InMemorySupportTicketRepository();
  const useCase = new ResolveSupportTicketUseCase(tickets);
  return { tickets, useCase };
}

const dto = (status: ResolveSupportTicketDto['status']): ResolveSupportTicketDto => ({ status });

describe('ResolveSupportTicketUseCase', () => {
  it('cambia el estado de un ticket existente y lo persiste', async () => {
    const { tickets, useCase } = build();
    tickets.seed(new SupportTicketBuilder().withId('t1').withStatus('open').build());

    const result = await useCase.execute({ ticketId: 't1', dto: dto('in_progress') });

    expect(result.status).toBe('in_progress');
    expect((await tickets.findById('t1'))?.status).toBe('in_progress');
  });

  // Invariante §4.1: workflow open → in_progress → resolved → closed.
  it('avanza el ticket por el workflow open → in_progress → resolved → closed', async () => {
    const { tickets, useCase } = build();
    tickets.seed(new SupportTicketBuilder().withId('t1').withStatus('open').build());

    await useCase.execute({ ticketId: 't1', dto: dto('in_progress') });
    expect((await tickets.findById('t1'))?.status).toBe('in_progress');

    await useCase.execute({ ticketId: 't1', dto: dto('resolved') });
    expect((await tickets.findById('t1'))?.status).toBe('resolved');

    const closed = await useCase.execute({ ticketId: 't1', dto: dto('closed') });
    expect(closed.status).toBe('closed');
  });

  it('ticket inexistente → SupportTicketNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ ticketId: 'ghost', dto: dto('resolved') }),
    ).rejects.toBeInstanceOf(SupportTicketNotFoundError);
  });

  it('no muta el estado cuando el ticket no existe', async () => {
    const { tickets, useCase } = build();
    tickets.seed(new SupportTicketBuilder().withId('t1').withStatus('open').build());
    await expect(
      useCase.execute({ ticketId: 'otro', dto: dto('closed') }),
    ).rejects.toBeInstanceOf(SupportTicketNotFoundError);
    expect((await tickets.findById('t1'))?.status).toBe('open');
  });
});
