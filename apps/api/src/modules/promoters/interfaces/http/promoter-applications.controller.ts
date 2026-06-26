import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  applyPromoterSchema,
  reviewPromoterApplicationSchema,
  type ApplyPromoterDto,
  type PromoterApplicationResponse,
  type ReviewPromoterApplicationDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { ApplyPromoterUseCase } from '../../application/use-cases/apply-promoter.use-case';
import { ReviewPromoterApplicationUseCase } from '../../application/use-cases/review-promoter-application.use-case';
import type { PromoterApplication } from '../../domain/entities/promoter-application.entity';

/** Postulaciones a promotor. /api/v1/promoter-applications. */
@Controller('promoter-applications')
export class PromoterApplicationsController {
  constructor(
    private readonly apply: ApplyPromoterUseCase,
    private readonly review: ReviewPromoterApplicationUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Body(new ZodValidationPipe(applyPromoterSchema)) dto: ApplyPromoterDto,
  ): Promise<PromoterApplicationResponse> {
    return toResponse(await this.apply.execute({ dto }));
  }

  @Roles('admin_local')
  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  async reviewApplication(
    @CurrentUser() reviewer: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reviewPromoterApplicationSchema)) dto: ReviewPromoterApplicationDto,
  ): Promise<PromoterApplicationResponse> {
    return toResponse(
      await this.review.execute({
        applicationId: id,
        reviewerId: reviewer.id,
        reviewerCompanyId: reviewer.companyId ?? null,
        isSuperAdmin: reviewer.roles.includes('super_admin'),
        dto,
      }),
    );
  }
}

function toResponse(a: PromoterApplication): PromoterApplicationResponse {
  return {
    id: a.id,
    name: a.name,
    status: a.status,
    createdPromoterId: a.createdPromoterId,
    createdAt: a.createdAt.toISOString(),
  };
}
