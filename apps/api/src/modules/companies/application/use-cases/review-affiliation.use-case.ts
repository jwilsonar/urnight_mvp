import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import slugify from '../../../../shared/utils/slugify';
import type { ReviewAffiliationDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import { UnitOfWork } from '../../../../shared/unit-of-work/unit-of-work';
import { Company } from '../../domain/entities/company.entity';
import { Local } from '../../domain/entities/local.entity';
import type { AffiliationRequest } from '../../domain/entities/affiliation-request.entity';
import {
  AffiliationAlreadyReviewedError,
  AffiliationNotFoundError,
} from '../../domain/errors/companies.errors';
import { AffiliationApprovedEvent } from '../../domain/events/companies.events';
import {
  AFFILIATION_REQUEST_REPOSITORY,
  type AffiliationRequestRepository,
} from '../../domain/ports/affiliation-request.repository';
import { COMPANY_REPOSITORY, type CompanyRepository } from '../../domain/ports/company.repository';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';

/**
 * Caso de uso: revisar solicitud de afiliación (super_admin). Al aprobar crea
 * empresa + local en una Tx atómica (UoW) y vincula la solicitud.
 */
@Injectable()
export class ReviewAffiliationUseCase {
  private readonly log = createLogger(ReviewAffiliationUseCase.name);

  constructor(
    @Inject(AFFILIATION_REQUEST_REPOSITORY)
    private readonly requests: AffiliationRequestRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companies: CompanyRepository,
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    private readonly uow: UnitOfWork,
    private readonly events: EventBus,
  ) {}

  async execute(input: {
    requestId: string;
    reviewerId: string;
    dto: ReviewAffiliationDto;
  }): Promise<AffiliationRequest> {
    const request = await this.requests.findById(input.requestId);
    if (!request) {
      this.log.warn({ requestId: input.requestId }, 'companies.affiliation.not_found');
      throw new AffiliationNotFoundError();
    }
    if (!request.isPending()) {
      this.log.warn({ requestId: request.id }, 'companies.affiliation.already_reviewed');
      throw new AffiliationAlreadyReviewedError();
    }

    if (input.dto.decision === 'rejected') {
      request.reject(input.reviewerId, input.dto.rejectionReason ?? 'Sin motivo');
      const saved = await this.requests.update(request);
      this.log.info({ requestId: saved.id, decision: 'rejected' }, 'companies.affiliation.reviewed');
      return saved;
    }

    const company = Company.create({
      id: randomUUID(),
      legalName: request.legalName,
      ruc: request.ruc,
      commercialName: request.commercialName,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone,
    });
    const local = Local.create({
      id: randomUUID(),
      companyId: company.id,
      zoneId: request.zoneId,
      name: request.commercialName,
      slug: `${slugify(request.commercialName)}-${company.id.slice(0, 8)}`,
    });
    request.approve(input.reviewerId, company.id, local.id);

    await this.uow.run(async (tx) => {
      await this.companies.create(company, tx);
      await this.locals.create(local, tx);
      await this.requests.update(request, tx);
    });

    await this.events.publish(
      new AffiliationApprovedEvent({
        affiliationId: request.id,
        companyId: company.id,
        localId: local.id,
      }),
    );
    this.log.info(
      { requestId: request.id, decision: 'approved', companyId: company.id, localId: local.id },
      'companies.affiliation.reviewed',
    );
    return request;
  }
}
