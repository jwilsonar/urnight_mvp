import type { DomainEvent } from '../../event-bus/domain-event';
import type { EventBus } from '../../event-bus/event-bus';

/** Colector de eventos publicados en el EventBus real (sin spies de librería). */
export interface CapturedEvents {
  /** Eventos recibidos, en orden de publicación. */
  readonly events: DomainEvent[];
  /** Nombres de los eventos recibidos. */
  names(): string[];
  /** Eventos con un `name` dado. */
  byName(name: string): DomainEvent[];
  /** Último evento recibido (o undefined). */
  last(): DomainEvent | undefined;
}

/**
 * Suscribe el bus real a los `eventNames` indicados y devuelve un colector.
 * Patrón existente en el proyecto: EventBus real + subscribe (no vi.spyOn).
 */
export function captureEvents(bus: EventBus, ...eventNames: string[]): CapturedEvents {
  const events: DomainEvent[] = [];
  for (const name of eventNames) {
    bus.subscribe(name, (event) => {
      events.push(event);
    });
  }
  return {
    events,
    names: () => events.map((e) => e.name),
    byName: (name: string) => events.filter((e) => e.name === name),
    last: () => events[events.length - 1],
  };
}
