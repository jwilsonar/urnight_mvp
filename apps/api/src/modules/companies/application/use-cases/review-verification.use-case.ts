import { Inject, Injectable } from '@nestjs/common';
import type { ReviewVerificationDto } from '@urnight/contracts';
import { createLogger } from '../../../../shared/logging/logger';
import { EventBus } from '../../../../shared/event-bus/event-bus';
import type { LocalVerification } from '../../domain/entities/local-verification.entity';
import {
  LocalNotFoundError,
  VerificationNotFoundError,
} from '../../domain/errors/companies.errors';
import { LocalVerifiedEvent } from '../../domain/events/companies.events';
import { LOCAL_REPOSITORY, type LocalRepository } from '../../domain/ports/local.repository';
import {
  LOCAL_VERIFICATION_REPOSITORY,
  type LocalVerificationRepository,
} from '../../domain/ports/local-verification.repository';

/** Caso de uso: revisar verificación (super_admin). Deriva local.isVerified. */
@Injectable()
export class ReviewVerificationUseCase {
  private readonly log = createLogger(ReviewVerificationUseCase.name);

  constructor(
    @Inject(LOCAL_VERIFICATION_REPOSITORY)
    private readonly verifications: LocalVerificationRepository,
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: {
    verificationId: string;
    reviewerId: string;
    dto: ReviewVerificationDto;
  }): Promise<LocalVerification> {
    const verification = await this.verifications.findById(input.verificationId);
    if (!verification) {
      this.log.warn({ verificationId: input.verificationId }, 'companies.verification.not_found');
      throw new VerificationNotFoundError();
    }

    verification.review(input.dto.decision, input.reviewerId, input.dto.notes);
    const saved = await this.verifications.update(verification);

    const local = await this.locals.findById(saved.localId);
    if (!local) {
      this.log.warn({ localId: saved.localId }, 'companies.verification.local_not_found');
      throw new LocalNotFoundError();
    }
    local.setVerified(saved.grantsVerification());
    await this.locals.update(local);

    await this.events.publish(
      new LocalVerifiedEvent({ localId: local.id, verified: local.isVerified }),
    );
    this.log.info(
      { localId: local.id, approved: local.isVerified },
      'companies.verification.reviewed',
    );
    return saved;
  }
}
