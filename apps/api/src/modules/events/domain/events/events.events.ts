import type { DomainEvent } from '../../../../shared/event-bus/domain-event';

export class EventPublishedEvent implements DomainEvent<{ eventId: string; localId: string }> {
  readonly name = 'events.event_published';
  readonly occurredAt = new Date();
  constructor(readonly payload: { eventId: string; localId: string }) {}
}

export class EventCancelledEvent implements DomainEvent<{ eventId: string; localId: string }> {
  readonly name = 'events.event_cancelled';
  readonly occurredAt = new Date();
  constructor(readonly payload: { eventId: string; localId: string }) {}
}
