import { describe, expect, it } from 'vitest';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { captureEvents } from '../../../../shared/testing/fakes';
import { InMemoryEventRepository } from '../../../../shared/testing/in-memory/events';
import { EventBuilder } from '../../../../shared/testing/builders/events';
import { FakeEventTenant, SUPER_ADMIN_SCOPE } from '../../../../shared/testing/fakes';
import {
  EventNotFoundError,
  EventNotPublishableError,
} from '../../domain/errors/events.errors';
import { PublishEventUseCase } from './publish-event.use-case';

function build() {
  const events = new InMemoryEventRepository();
  const bus = new EventBus();
  const useCase = new PublishEventUseCase(events, new FakeEventTenant(), bus);
  return { events, bus, useCase };
}

describe('PublishEventUseCase', () => {
  it('publica el evento, lo persiste y emite EventPublishedEvent', async () => {
    const { events, bus, useCase } = build();
    await events.create(
      new EventBuilder().withId('e1').withLocalId('l1').withStatus('draft').build(),
    );
    const captured = captureEvents(bus, 'events.event_published');

    const result = await useCase.execute({ eventId: 'e1', scope: SUPER_ADMIN_SCOPE });

    expect(result.status).toBe('published');
    expect(result.publishedAt).not.toBeNull();
    expect(events.all[0]?.status).toBe('published');
    expect(captured.names()).toContain('events.event_published');
    expect(captured.last()?.payload).toEqual({ eventId: 'e1', localId: 'l1' });
  });

  it('evento inexistente → EventNotFoundError', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ eventId: 'ghost', scope: SUPER_ADMIN_SCOPE }),
    ).rejects.toBeInstanceOf(EventNotFoundError);
  });

  it('evento cancelado no es publicable → EventNotPublishableError', async () => {
    const { events, bus, useCase } = build();
    await events.create(new EventBuilder().withId('e1').asCancelled().build());
    const captured = captureEvents(bus, 'events.event_published');

    await expect(
      useCase.execute({ eventId: 'e1', scope: SUPER_ADMIN_SCOPE }),
    ).rejects.toBeInstanceOf(EventNotPublishableError);
    expect(captured.names()).toHaveLength(0);
  });

  it('evento finalizado no es publicable → EventNotPublishableError', async () => {
    const { events, useCase } = build();
    await events.create(new EventBuilder().withId('e1').asFinished().build());
    await expect(
      useCase.execute({ eventId: 'e1', scope: SUPER_ADMIN_SCOPE }),
    ).rejects.toBeInstanceOf(EventNotPublishableError);
  });
});
