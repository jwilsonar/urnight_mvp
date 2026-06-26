import { describe, expect, it } from 'vitest';
import { InMemoryEventRepository } from '../../../../shared/testing/in-memory/events';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { GetEventUseCase } from './get-event.use-case';

function build() {
  const events = new InMemoryEventRepository();
  const useCase = new GetEventUseCase(events);
  return { events, useCase };
}

describe('GetEventUseCase', () => {
  it('devuelve el evento por slug', async () => {
    const { events, useCase } = build();
    await events.create(new EventBuilder().withId('e1').withSlug('mi-evento').build());

    const result = await useCase.execute('mi-evento');

    expect(result.id).toBe('e1');
    expect(result.slug).toBe('mi-evento');
  });

  it('slug inexistente → EventNotFoundError', async () => {
    const { useCase } = build();
    await expect(useCase.execute('ghost')).rejects.toBeInstanceOf(EventNotFoundError);
  });
});
