export const PROMOTERS_ERROR_CODES = {
  PROMOTER_NOT_FOUND: 'promoters/promoter-not-found',
  APPLICATION_NOT_FOUND: 'promoters/application-not-found',
  APPLICATION_ALREADY_REVIEWED: 'promoters/application-already-reviewed',
  PROMO_CODE_NOT_FOUND: 'promoters/promo-code-not-found',
  PROMO_CODE_CODE_TAKEN: 'promoters/promo-code-code-taken',
  PROMO_CODE_INVALID: 'promoters/promo-code-invalid',
  PROMO_CODE_QUOTA_EXHAUSTED: 'promoters/promo-code-quota-exhausted',
  PROMO_CODE_ALREADY_REDEEMED: 'promoters/promo-code-already-redeemed',
  REFERRAL_CODE_TAKEN: 'promoters/referral-code-taken',
  ASSOCIATION_NOT_PENDING: 'promoters/association-not-pending',
  ASSOCIATION_FORBIDDEN: 'promoters/association-forbidden',
  PROMOTER_EVENT_NOT_FOUND: 'promoters/promoter-event-not-found',
  ALLOCATION_NOT_FOUND: 'promoters/allocation-not-found',
  ALLOCATION_EXHAUSTED: 'promoters/allocation-exhausted',
  ALLOCATION_EXCEEDS_STOCK: 'promoters/allocation-exceeds-stock',
  ASSIGNMENT_FORBIDDEN: 'promoters/assignment-forbidden',
} as const;

export type PromotersErrorCode =
  (typeof PROMOTERS_ERROR_CODES)[keyof typeof PROMOTERS_ERROR_CODES];
