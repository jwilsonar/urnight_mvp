import type { CreateReviewDto } from '@urnight/contracts';
import type { Review } from '../../../../modules/trust/domain/entities/review.entity';
import { ReviewBuilder } from '../../builders/trust/review.builder';

/** Casos predefinidos de Review y DTOs de entrada para los casos de uso. */
export const ReviewMother = {
  /** Reseña verificada de un local (5 estrellas, publicada). */
  forLocal: (localId = 'local-1'): Review =>
    new ReviewBuilder().forLocal(localId).withRating(5).build(),

  /** Reseña verificada de un evento (5 estrellas, publicada). */
  forEvent: (eventId = 'event-1'): Review =>
    new ReviewBuilder().forEvent(eventId).withRating(5).build(),

  /** Reseña ya oculta (status='hidden') — no debe listarse públicamente. */
  hidden: (localId = 'local-1'): Review =>
    new ReviewBuilder().forLocal(localId).asHidden().build(),

  /** DTO válido para reseñar un local. */
  createLocalDto: (overrides: Partial<CreateReviewDto> = {}): CreateReviewDto => ({
    targetType: 'local',
    localId: 'local-1',
    ticketId: 'ticket-1',
    rating: 5,
    ...overrides,
  }),

  /** DTO válido para reseñar un evento. */
  createEventDto: (overrides: Partial<CreateReviewDto> = {}): CreateReviewDto => ({
    targetType: 'event',
    eventId: 'event-1',
    ticketId: 'ticket-1',
    rating: 4,
    ...overrides,
  }),
};
