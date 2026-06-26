import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { recordAnalyticsSchema, type AnalyticsAck, type RecordAnalyticsDto } from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Public } from '../../../../edge/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { RecordAnalyticsUseCase } from '../../application/use-cases/record-analytics.use-case';

/** Ingesta de analítica. /api/v1/analytics. Público (anónimo o autenticado). */
@Public()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly recordAnalytics: RecordAnalyticsUseCase) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async record(
    @CurrentUser() user: AuthUser | undefined,
    @Body(new ZodValidationPipe(recordAnalyticsSchema)) dto: RecordAnalyticsDto,
  ): Promise<AnalyticsAck> {
    await this.recordAnalytics.execute({ dto, userId: user?.id ?? null });
    return { recorded: true };
  }
}
