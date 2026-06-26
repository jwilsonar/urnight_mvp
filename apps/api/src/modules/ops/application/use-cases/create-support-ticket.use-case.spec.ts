import type { CreateSupportTicketDto } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { InMemorySupportTicketRepository } from '../../../../shared/testing/in-memory/ops';
import { CreateSupportTicketUseCase } from './create-support-ticket.use-case';

function build() {
  const tickets = new InMemorySupportTicketRepository();
  const useCase = new CreateSupportTicketUseCase(tickets);
  return { tickets, useCase };
}

const dto = (over: Partial<CreateSupportTicketDto> = {}): CreateSupportTicketDto => ({
  subject: 'No puedo validar mi QR',
  category: 'incident',
  priority: 'high',
  ...over,
});

describe('CreateSupportTicketUseCase', () => {
  it('abre un ticket en estado "open" y lo persiste', async () => {
    const { tickets, useCase } = build();

    const result = await useCase.execute({ dto: dto(), openedBy: 'user-1' });

    expect(result.status).toBe('open');
    expect(result.subject).toBe('No puedo validar mi QR');
    expect(result.category).toBe('incident');
    expect(result.priority).toBe('high');
    expect(result.openedBy).toBe('user-1');
    expect(tickets.size).toBe(1);
    expect(await tickets.findById(result.id)).not.toBeNull();
  });

  it('genera un ticketCode con prefijo SUP-', async () => {
    const { useCase } = build();
    const result = await useCase.execute({ dto: dto(), openedBy: 'user-1' });
    expect(result.ticketCode).toMatch(/^SUP-[0-9A-F]{6}$/);
  });

  it('respeta el localId opcional del DTO (default null)', async () => {
    const { useCase } = build();
    const withLocal = await useCase.execute({
      dto: dto({ localId: 'local-9' }),
      openedBy: 'user-1',
    });
    expect(withLocal.localId).toBe('local-9');

    const withoutLocal = await useCase.execute({ dto: dto(), openedBy: 'user-1' });
    expect(withoutLocal.localId).toBeNull();
  });

  it('persiste exactamente el ticket creado en el repositorio', async () => {
    const { tickets, useCase } = build();
    const result = await useCase.execute({ dto: dto(), openedBy: 'user-1' });
    expect(tickets.all).toHaveLength(1);
    expect(tickets.all[0]?.id).toBe(result.id);
  });
});
