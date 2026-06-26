import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SubmitAffiliationDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { AffiliationRequest } from '../../domain/entities/affiliation-request.entity';
import {
  AFFILIATION_REQUEST_REPOSITORY,
  type AffiliationRequestRepository,
} from '../../domain/ports/affiliation-request.repository';

/** Caso de uso (público): enviar solicitud de afiliación. */
@Injectable()
export class SubmitAffiliationUseCase {
  private readonly log = createLogger(SubmitAffiliationUseCase.name);

  constructor(
    @Inject(AFFILIATION_REQUEST_REPOSITORY)
    private readonly requests: AffiliationRequestRepository,
  ) {}

  async execute(input: { dto: SubmitAffiliationDto; submittedBy?: string | null }): Promise<AffiliationRequest> {
    const request = AffiliationRequest.submit({
      id: randomUUID(),
      ...input.dto,
      submittedBy: input.submittedBy ?? null,
    });
    const saved = await this.requests.create(request);
    this.log.info({ requestId: saved.id }, 'companies.affiliation.submitted');
    return saved;
  }
}
