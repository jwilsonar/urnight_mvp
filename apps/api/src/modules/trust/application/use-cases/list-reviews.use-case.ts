import { Inject, Injectable } from '@nestjs/common';
import type { Review } from '../../domain/entities/review.entity';
import { REVIEW_REPOSITORY, type ReviewRepository } from '../../domain/ports/review.repository';

/** Caso de uso (lectura pública): reseñas de un local o evento. */
@Injectable()
export class ListReviewsUseCase {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository) {}

  execute(target: { localId?: string; eventId?: string }): Promise<Review[]> {
    return this.reviews.listByTarget(target);
  }
}
