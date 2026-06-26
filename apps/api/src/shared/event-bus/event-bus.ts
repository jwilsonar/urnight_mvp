import { Injectable } from '@nestjs/common';
import { createLogger } from '../logging/logger';
import type { DomainEvent, DomainEventHandler } from './domain-event';

/**
 * Domain Event Bus in-process (§3.2). Desacopla módulos: un caso de uso
 * publica `OrderPaid` y atribución/analytics/notif reaccionan sin acoplarse.
 * Comunicación entre módulos: SOLO vía este bus o puertos públicos.
 */
@Injectable()
export class EventBus {
  private readonly log = createLogger(EventBus.name);
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  subscribe<E extends DomainEvent>(eventName: string, handler: DomainEventHandler<E>): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler as DomainEventHandler);
    this.handlers.set(eventName, list);
  }

  async publish(event: DomainEvent): Promise<void> {
    const list = this.handlers.get(event.name) ?? [];
    this.log.debug({ event: event.name, handlers: list.length }, 'eventbus.publish');
    for (const handler of list) {
      try {
        await handler(event);
      } catch (err) {
        // Aislamiento: un handler que falla no tumba a los demás ni al emisor.
        this.log.error({ event: event.name, err }, 'eventbus.handler_failed');
      }
    }
  }
}
