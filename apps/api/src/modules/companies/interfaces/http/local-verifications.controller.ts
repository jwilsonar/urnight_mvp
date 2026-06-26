import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  reviewVerificationSchema,
  type ReviewVerificationDto,
  type VerificationResponse,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { ReviewVerificationUseCase } from '../../application/use-cases/review-verification.use-case';
import { toVerificationResponse } from './locals.controller';

/** Revisión de verificaciones (super_admin). /api/v1/local-verifications. */
@Roles('super_admin')
@Controller('local-verifications')
export class LocalVerificationsController {
  constructor(private readonly review: ReviewVerificationUseCase) {}

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  async reviewVerification(
    @CurrentUser() reviewer: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reviewVerificationSchema)) dto: ReviewVerificationDto,
  ): Promise<VerificationResponse> {
    return toVerificationResponse(
      await this.review.execute({ verificationId: id, reviewerId: reviewer.id, dto }),
    );
  }
}
