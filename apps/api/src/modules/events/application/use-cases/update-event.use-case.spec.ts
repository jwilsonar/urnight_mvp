import { describe, expect, it } from 'vitest';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { FakeEventTenant, FakeStorage, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import { InMemoryEventRepository } from '../../../../shared/testing/in-memory/events';
import { UpdateEventUseCase } from './update-event.use-case';

describe('UpdateEventUseCase', () => {
  it('reemplaza el set de géneros con los 8 valores del catálogo actual', async () => {
    const events = new InMemoryEventRepository();
    const event = new EventBuilder().withId('event-1').build();
    const genreIds = Array.from(
      { length: 8 },
      (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    );
    await events.create(event);
    const useCase = new UpdateEventUseCase(
      events,
      new FakeEventTenant(),
      new FakeStorage(),
    );

    const result = await useCase.execute({
      eventId: event.id,
      dto: { genreIds },
      scope: SUPER_ADMIN_SCOPE,
    });

    expect(result.genreIds).toEqual(genreIds);
  });
});
