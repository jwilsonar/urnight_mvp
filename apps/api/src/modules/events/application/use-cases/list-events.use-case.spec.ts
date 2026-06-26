import { describe, expect, it } from 'vitest';
import { InMemoryEventRepository } from '../../../../shared/testing/in-memory/events';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { ListEventsUseCase } from './list-events.use-case';

function build() {
  const events = new InMemoryEventRepository();
  const useCase = new ListEventsUseCase(events);
  return { events, useCase };
}

describe('ListEventsUseCase', () => {
  it('solo devuelve eventos publicados', async () => {
    const { events, useCase } = build();
    await events.create(new EventBuilder().withId('e1').withSlug('pub').asPublished().build());
    await events.create(new EventBuilder().withId('e2').withSlug('draft').withStatus('draft').build());

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('e1');
  });

  it('filtra eventos publicados por local', async () => {
    const { events, useCase } = build();
    await events.create(
      new EventBuilder().withId('e1').withSlug('a').withLocalId('l1').asPublished().build(),
    );
    await events.create(
      new EventBuilder().withId('e2').withSlug('b').withLocalId('l2').asPublished().build(),
    );

    const result = await useCase.execute({ localId: 'l1' });

    expect(result).toHaveLength(1);
    expect(result[0]?.localId).toBe('l1');
  });

  it('devuelve lista vacía cuando no hay eventos publicados', async () => {
    const { useCase } = build();
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });
});
