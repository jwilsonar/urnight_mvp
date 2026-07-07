import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type { ReviewPromoterApplicationDto } from '@urnight/contracts';
import { TenantForbiddenError } from '../../../../shared/errors/tenant-forbidden.error';
import { createLogger } from '../../../../shared/logging/logger';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { Promoter } from '../../domain/entities/promoter.entity';
import { ReferralLink } from '../../domain/entities/referral-link.entity';
import type { PromoterApplication } from '../../domain/entities/promoter-application.entity';
import {
  ApplicationAlreadyReviewedError,
  ApplicationNotFoundError,
} from '../../domain/errors/promoters.errors';
import {
  PROMOTER_APPLICATION_REPOSITORY,
  type PromoterApplicationRepository,
} from '../../domain/ports/promoter-application.repository';
import {
  PROMOTER_REPOSITORY,
  type PromoterRepository,
} from '../../domain/ports/promoter.repository';
import {
  REFERRAL_LINK_REPOSITORY,
  type ReferralLinkRepository,
} from '../../domain/ports/referral-link.repository';
import { referralUrlFor } from '../config/web-url';

/** Caso de uso: revisar postulación. Aprobar crea promotor+link (Tx). */
@Injectable()
export class ReviewPromoterApplicationUseCase {
  private readonly log = createLogger(ReviewPromoterApplicationUseCase.name);

  constructor(
    @Inject(PROMOTER_APPLICATION_REPOSITORY)
    private readonly applications: PromoterApplicationRepository,
    @Inject(PROMOTER_REPOSITORY) private readonly promoters: PromoterRepository,
    @Inject(REFERRAL_LINK_REPOSITORY) private readonly links: ReferralLinkRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(input: {
    applicationId: string;
    reviewerId: string;
    reviewerCompanyId: string | null;
    isSuperAdmin: boolean;
    dto: ReviewPromoterApplicationDto;
  }): Promise<PromoterApplication> {
    this.log.debug({ applicationId: input.applicationId }, 'promoters.application.review_started');
    const application = await this.applications.findById(input.applicationId);
    if (!application) {
      this.log.warn({ applicationId: input.applicationId }, 'promoters.application.not_found');
      throw new ApplicationNotFoundError();
    }
    if (!application.isPending()) {
      this.log.warn({ applicationId: input.applicationId }, 'promoters.application.already_reviewed');
      throw new ApplicationAlreadyReviewedError();
    }

    if (input.dto.decision === 'rejected') {
      application.reject(input.reviewerId);
      const updated = await this.applications.update(application);
      this.log.info({ applicationId: input.applicationId, approved: false }, 'promoters.application.reviewed');
      return updated;
    }

    // Aislamiento tenant: el promotor SIEMPRE se crea en la empresa del actor.
    // admin_local nunca puede asignar otra empresa por el body; super_admin sí
    // puede indicarla (no tiene empresa propia).
    const companyId = input.isSuperAdmin
      ? (input.dto.companyId ?? null)
      : input.reviewerCompanyId;
    if (!companyId) throw new TenantForbiddenError();

    const promoter = Promoter.create({
      id: randomUUID(),
      companyId,
      localId: application.localId,
      userId: application.applicantUserId,
      name: application.name,
      contactEmail: application.contactEmail,
      contactPhone: application.contactPhone,
    });
    const code = await this.uniqueCode();
    const link = ReferralLink.create({
      id: randomUUID(),
      promoterId: promoter.id,
      code,
      url: referralUrlFor(code),
    });
    application.approve(input.reviewerId, promoter.id);

    await this.uow.run(async (tx) => {
      await this.promoters.create(promoter, link, tx);
      await this.applications.update(application, tx);
    });
    this.log.info(
      { applicationId: input.applicationId, approved: true, promoterId: promoter.id },
      'promoters.application.reviewed',
    );
    return application;
  }

  private async uniqueCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      if (!(await this.links.existsByCode(code))) return code;
    }
    return randomBytes(6).toString('hex').toUpperCase().slice(0, 12);
  }
}
