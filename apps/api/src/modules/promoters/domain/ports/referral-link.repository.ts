import type { ReferralLink } from '../entities/referral-link.entity';

export interface ReferralLinkRepository {
  findByCode(code: string): Promise<ReferralLink | null>;
  existsByCode(code: string): Promise<boolean>;
  registerClick(code: string): Promise<void>;
}

export const REFERRAL_LINK_REPOSITORY = Symbol('REFERRAL_LINK_REPOSITORY');
