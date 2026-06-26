export const EVENTS_ERROR_CODES = {
  EVENT_NOT_FOUND: 'events/event-not-found',
  EVENT_SLUG_TAKEN: 'events/event-slug-taken',
  EVENT_NOT_PUBLISHABLE: 'events/event-not-publishable',
  TICKET_TYPE_NOT_FOUND: 'events/ticket-type-not-found',
  LOCAL_NOT_FOUND: 'events/local-not-found',
  EVENT_FLYER_INVALID: 'events/event-flyer-invalid',
  EVENT_FLYER_NOT_FOUND: 'events/event-flyer-not-found',
} as const;

export type EventsErrorCode = (typeof EVENTS_ERROR_CODES)[keyof typeof EVENTS_ERROR_CODES];
