import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateReviewDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { Review } from '../../domain/entities/review.entity';
import { ReviewNotEligibleError } from '../../domain/errors/trust.errors';
import {
  ATTENDANCE_PORT,
  REVIEW_REPOSITORY,
  type AttendancePort,
  type ReviewRepository,
} from '../../domain/ports/review.repository';

/** Caso de uso: crear reseña (requiere entrada usada del target → isVerified). */
@Injectable()
export class CreateReviewUseCase {
  private readonly log = createLogger(CreateReviewUseCase.name);

  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(ATTENDANCE_PORT) private readonly attendance: AttendancePort,
  ) {}

  async execute(input: { userId: string; dto: CreateReviewDto }): Promise<Review> {
    this.log.debug(
      { userId: input.userId, ticketId: input.dto.ticketId, targetType: input.dto.targetType },
      'trust.review.started',
    );
    const ctx = await this.attendance.getUsedTicketContext(input.userId, input.dto.ticketId);
    if (!ctx) {
      this.log.warn({ userId: input.userId, ticketId: input.dto.ticketId }, 'trust.review.not_eligible');
      throw new ReviewNotEligibleError();
    }

    const matches =
      input.dto.targetType === 'event'
        ? input.dto.eventId === ctx.eventId
        : input.dto.localId === ctx.localId;
    if (!matches) {
      this.log.warn(
        { userId: input.userId, ticketId: input.dto.ticketId, targetType: input.dto.targetType },
        'trust.review.not_eligible',
      );
      throw new ReviewNotEligibleError();
    }

    const review = Review.create({
      id: randomUUID(),
      userId: input.userId,
      targetType: input.dto.targetType,
      localId: input.dto.localId ?? null,
      eventId: input.dto.eventId ?? null,
      ticketId: input.dto.ticketId,
      rating: input.dto.rating,
      comment: input.dto.comment ?? null,
      quickTags: input.dto.quickTags ?? null,
      isVerified: true,
    });
    const created = await this.reviews.create(review);
    this.log.info(
      {
        reviewId: created.id,
        userId: input.userId,
        targetType: input.dto.targetType,
        localId: input.dto.localId ?? null,
        eventId: input.dto.eventId ?? null,
      },
      'trust.review.created',
    );
    return created;
  }
}
