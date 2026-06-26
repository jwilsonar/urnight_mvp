import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { captureEvents, FakeEventTenant, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import { InMemoryEventRepository } from '../../../../shared/testing/in-memory/events';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { EventNotFoundError } from '../../domain/errors/events.errors';
import { CancelEventUseCase } from './cancel-event.use-case';

function build() {
  const events = new InMemoryEventRepository();
  const bus = new EventBus();
  const useCase = new CancelEventUseCase(events, new FakeEventTenant(), bus);
  return { events, bus, useCase };
}

describe('CancelEventUseCase', () => {
  it('cancela el evento, lo persiste y emite EventCancelledEvent', async () => {
    const { events, bus, useCase } = build();
    await events.create(
      new EventBuilder().withId('e1').withLocalId('l1').asPublished().build(),
    );
    const captured = captureEvents(bus, 'events.event_cancelled');

    const result = await useCase.execute({ eventId: 'e1', scope: SUPER_ADMIN_SCOPE });

    expect(result.status).toBe('cancelled');
    expect(events.all[0]?.status).toBe('cancelled');
    expect(captured.names()).toContain('events.event_cancelled');
    expect(captured.last()?.payload).toEqual({ eventId: 'e1', localId: 'l1' });
  });

  it('evento inexistente → EventNotFoundError', async () => {
    const { bus, useCase } = build();
    const captured = captureEvents(bus, 'events.event_cancelled');

    await expect(
      useCase.execute({ eventId: 'ghost', scope: SUPER_ADMIN_SCOPE }),
    ).rejects.toBeInstanceOf(EventNotFoundError);
    expect(captured.names()).toHaveLength(0);
  });
});
