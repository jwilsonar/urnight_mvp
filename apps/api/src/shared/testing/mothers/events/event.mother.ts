import type { Event } from '../../../../modules/events/domain/entities/event.entity';
import { EventBuilder } from '../../builders/events/event.builder';

/** Casos predefinidos de Event. */
export const EventMother = {
  draft: (): Event => new EventBuilder().build(),
  published: (): Event => new EventBuilder().asPublished().build(),
  cancelled: (): Event => new EventBuilder().asCancelled().build(),
  finished: (): Event => new EventBuilder().asFinished().build(),
  withCapacity: (totalCapacity: number, ticketsSold = 0): Event =>
    new EventBuilder().withTotalCapacity(totalCapacity).withTicketsSold(ticketsSold).build(),
};
