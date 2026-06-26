import type { ReferralLink } from '../../../../modules/promoters/domain/entities/referral-link.entity';
import { ReferralLinkBuilder } from '../../builders/promoters/referral-link.builder';

/** Casos predefinidos de ReferralLink. */
export const ReferralLinkMother = {
  active: (): ReferralLink => new ReferralLinkBuilder().build(),
  inactive: (): ReferralLink => new ReferralLinkBuilder().asInactive().build(),
  withClicks: (clicks: number): ReferralLink => new ReferralLinkBuilder().withClicks(clicks).build(),
};
