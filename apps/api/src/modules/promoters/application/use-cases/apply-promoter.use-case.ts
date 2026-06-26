import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ApplyPromoterDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { PromoterApplication } from '../../domain/entities/promoter-application.entity';
import {
  PROMOTER_APPLICATION_REPOSITORY,
  type PromoterApplicationRepository,
} from '../../domain/ports/promoter-application.repository';

/** Caso de uso: postular para ser promotor (público / usuario). */
@Injectable()
export class ApplyPromoterUseCase {
  private readonly log = createLogger(ApplyPromoterUseCase.name);

  constructor(
    @Inject(PROMOTER_APPLICATION_REPOSITORY)
    private readonly applications: PromoterApplicationRepository,
  ) {}

  async execute(input: { dto: ApplyPromoterDto; applicantUserId?: string | null }): Promise<PromoterApplication> {
    this.log.debug({ userId: input.applicantUserId ?? undefined }, 'promoters.application.started');
    const application = PromoterApplication.submit({
      id: randomUUID(),
      ...input.dto,
      applicantUserId: input.applicantUserId ?? null,
    });
    const result = await this.applications.create(application);
    this.log.info({ applicationId: result.id, userId: input.applicantUserId ?? undefined }, 'promoters.application.submitted');
    return result;
  }
}
