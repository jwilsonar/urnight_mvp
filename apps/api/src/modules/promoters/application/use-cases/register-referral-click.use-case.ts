import { Inject, Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/logging/logger';
import {
  REFERRAL_LINK_REPOSITORY,
  type ReferralLinkRepository,
} from '../../domain/ports/referral-link.repository';

/** Caso de uso: registrar clic en un link de referido (público). */
@Injectable()
export class RegisterReferralClickUseCase {
  private readonly log = createLogger(RegisterReferralClickUseCase.name);

  constructor(@Inject(REFERRAL_LINK_REPOSITORY) private readonly links: ReferralLinkRepository) {}

  async execute(code: string): Promise<void> {
    this.log.debug({ referralCode: code }, 'promoters.referral.clicked');
    await this.links.registerClick(code);
  }
}
