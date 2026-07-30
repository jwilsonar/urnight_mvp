import { randomUUID } from 'node:crypto';
import { availableCapacity } from '@urnight/db';
import {
  Event,
  type EventStatus,
} from '../../../../modules/events/domain/entities/event.entity';

/** Builder fluido para el aggregate Event (§4.1: aforo + estado de publicación). */
export class EventBuilder {
  private id: string = randomUUID();
  private localId: string = randomUUID();
  private name = 'Noche Techno';
  private slug = 'noche-techno';
  private description: string | null = null;
  private startsAt: Date = new Date('2026-12-31T23:00:00.000Z');
  private endsAt: Date | null = null;
  private flyerUrl: string | null = null;
  private totalCapacity = 0;
  private minAgeNote = '+18';
  private dressCode: string | null = null;
  private createdBy: string | null = null;
  private status: EventStatus = 'draft';
  private ticketsSold = 0;
  private activeHolds = 0;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withLocalId(localId: string): this {
    this.localId = localId;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withSlug(slug: string): this {
    this.slug = slug;
    return this;
  }

  withDescription(description: string | null): this {
    this.description = description;
    return this;
  }

  withStartsAt(startsAt: Date): this {
    this.startsAt = startsAt;
    return this;
  }

  withEndsAt(endsAt: Date | null): this {
    this.endsAt = endsAt;
    return this;
  }

  withFlyerUrl(flyerUrl: string | null): this {
    this.flyerUrl = flyerUrl;
    return this;
  }

  withTotalCapacity(totalCapacity: number): this {
    this.totalCapacity = totalCapacity;
    return this;
  }

  withTicketsSold(ticketsSold: number): this {
    this.ticketsSold = ticketsSold;
    return this;
  }

  withActiveHolds(activeHolds: number): this {
    this.activeHolds = activeHolds;
    return this;
  }

  withMinAgeNote(minAgeNote: string): this {
    this.minAgeNote = minAgeNote;
    return this;
  }

  withDressCode(dressCode: string | null): this {
    this.dressCode = dressCode;
    return this;
  }

  withCreatedBy(createdBy: string | null): this {
    this.createdBy = createdBy;
    return this;
  }

  /** Estado final del evento (hidrata vía fromPersistence para evitar el `now` real). */
  withStatus(status: EventStatus): this {
    this.status = status;
    return this;
  }

  asPublished(): this {
    this.status = 'published';
    return this;
  }

  asCancelled(): this {
    this.status = 'cancelled';
    return this;
  }

  asFinished(): this {
    this.status = 'finished';
    return this;
  }

  asScheduled(): this {
    this.status = 'scheduled';
    return this;
  }

  build(): Event {
    const now = new Date();
    return Event.fromPersistence({
      id: this.id,
      localId: this.localId,
      name: this.name.trim(),
      slug: this.slug,
      description: this.description,
      startsAt: this.startsAt,
      endsAt: this.endsAt,
      flyerUrl: this.flyerUrl,
      totalCapacity: this.totalCapacity,
      ticketsSold: this.ticketsSold,
      availableCapacity:
        this.totalCapacity === 0
          ? null
          : availableCapacity(
              this.totalCapacity,
              this.ticketsSold,
              this.activeHolds,
            ),
      checkinsCount: 0,
      status: this.status,
      minAgeNote: this.minAgeNote,
      dressCode: this.dressCode,
      customTags: [],
      createdBy: this.createdBy,
      publishedAt: this.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
