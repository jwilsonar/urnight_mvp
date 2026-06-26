import { randomUUID } from 'node:crypto';
import {
  Review,
  type ReviewProps,
  type ReviewStatus,
  type TargetType,
} from '../../../../modules/trust/domain/entities/review.entity';

/** Builder fluido para el aggregate Review (delegando en `Review.fromPersistence`). */
export class ReviewBuilder {
  private id: string = randomUUID();
  private userId = 'user-1';
  private targetType: TargetType = 'local';
  private localId: string | null = 'local-1';
  private eventId: string | null = null;
  private ticketId: string | null = 'ticket-1';
  private rating = 5;
  private comment: string | null = null;
  private quickTags: string[] | null = null;
  private isVerified = true;
  private isReported = false;
  private status: ReviewStatus = 'published';
  private createdAt = new Date('2026-01-01T00:00:00Z');

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  /** Apunta la reseña a un local (target local, eventId = null). */
  forLocal(localId: string): this {
    this.targetType = 'local';
    this.localId = localId;
    this.eventId = null;
    return this;
  }

  /** Apunta la reseña a un evento (target event, localId = null). */
  forEvent(eventId: string): this {
    this.targetType = 'event';
    this.eventId = eventId;
    this.localId = null;
    return this;
  }

  withTicketId(ticketId: string | null): this {
    this.ticketId = ticketId;
    return this;
  }

  withRating(rating: number): this {
    this.rating = rating;
    return this;
  }

  withComment(comment: string | null): this {
    this.comment = comment;
    return this;
  }

  withQuickTags(quickTags: string[] | null): this {
    this.quickTags = quickTags;
    return this;
  }

  withIsVerified(isVerified: boolean): this {
    this.isVerified = isVerified;
    return this;
  }

  withIsReported(isReported: boolean): this {
    this.isReported = isReported;
    return this;
  }

  withStatus(status: ReviewStatus): this {
    this.status = status;
    return this;
  }

  asHidden(): this {
    this.status = 'hidden';
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  build(): Review {
    const props: ReviewProps = {
      id: this.id,
      userId: this.userId,
      targetType: this.targetType,
      localId: this.localId,
      eventId: this.eventId,
      ticketId: this.ticketId,
      rating: this.rating,
      comment: this.comment,
      quickTags: this.quickTags,
      isVerified: this.isVerified,
      isReported: this.isReported,
      status: this.status,
      createdAt: this.createdAt,
    };
    return Review.fromPersistence(props);
  }
}
