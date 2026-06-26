export const TRUST_ERROR_CODES = {
  REVIEW_NOT_ELIGIBLE: 'trust/review-not-eligible',
  REVIEW_NOT_FOUND: 'trust/review-not-found',
  REPORT_NOT_FOUND: 'trust/report-not-found',
} as const;

export type TrustErrorCode = (typeof TRUST_ERROR_CODES)[keyof typeof TRUST_ERROR_CODES];
