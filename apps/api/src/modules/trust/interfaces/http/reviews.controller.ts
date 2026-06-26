import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  createReviewSchema,
  type CreateReviewDto,
  type ReviewResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { ListReviewsUseCase } from '../../application/use-cases/list-reviews.use-case';
import type { Review } from '../../domain/entities/review.entity';

/** Reseñas. /api/v1/reviews. Lectura pública; crear requiere entrada usada. */
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly createReview: CreateReviewUseCase,
    private readonly listReviews: ListReviewsUseCase,
  ) {}

  @Public()
  @Get()
  async list(
    @Query('localId') localId?: string,
    @Query('eventId') eventId?: string,
  ): Promise<ReviewResponse[]> {
    return (await this.listReviews.execute({ localId, eventId })).map(toReviewResponse);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewDto,
  ): Promise<ReviewResponse> {
    return toReviewResponse(await this.createReview.execute({ userId: user.id, dto }));
  }
}

function toReviewResponse(r: Review): ReviewResponse {
  return {
    id: r.id,
    targetType: r.targetType,
    localId: r.localId,
    eventId: r.eventId,
    rating: r.rating,
    comment: r.comment,
    isVerified: r.isVerified,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}
