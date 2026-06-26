import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  reviewAffiliationSchema,
  submitAffiliationSchema,
  type AffiliationResponse,
  type ReviewAffiliationDto,
  type SubmitAffiliationDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { ReviewAffiliationUseCase } from '../../application/use-cases/review-affiliation.use-case';
import { SubmitAffiliationUseCase } from '../../application/use-cases/submit-affiliation.use-case';
import type { AffiliationRequest } from '../../domain/entities/affiliation-request.entity';

/** Solicitudes de afiliación. /api/v1/affiliation-requests. */
@Controller('affiliation-requests')
export class AffiliationController {
  constructor(
    private readonly submit: SubmitAffiliationUseCase,
    private readonly review: ReviewAffiliationUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(submitAffiliationSchema)) dto: SubmitAffiliationDto,
  ): Promise<AffiliationResponse> {
    return toAffiliationResponse(await this.submit.execute({ dto }));
  }

  @Roles('super_admin')
  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  async reviewRequest(
    @CurrentUser() reviewer: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reviewAffiliationSchema)) dto: ReviewAffiliationDto,
  ): Promise<AffiliationResponse> {
    return toAffiliationResponse(
      await this.review.execute({ requestId: id, reviewerId: reviewer.id, dto }),
    );
  }
}

function toAffiliationResponse(a: AffiliationRequest): AffiliationResponse {
  return {
    id: a.id,
    legalName: a.legalName,
    ruc: a.ruc,
    commercialName: a.commercialName,
    status: a.status,
    rejectionReason: a.rejectionReason,
    companyId: a.companyId,
    localId: a.localId,
    createdAt: a.createdAt.toISOString(),
  };
}
