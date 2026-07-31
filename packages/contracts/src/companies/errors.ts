export const COMPANIES_ERROR_CODES = {
  COMPANY_NOT_FOUND: 'companies/company-not-found',
  RUC_ALREADY_REGISTERED: 'companies/ruc-already-registered',
  LOCAL_NOT_FOUND: 'companies/local-not-found',
  LOCAL_SLUG_TAKEN: 'companies/local-slug-taken',
  VERIFICATION_NOT_FOUND: 'companies/verification-not-found',
  VERIFICATION_DOCUMENT_NOT_FOUND: 'companies/verification-document-not-found',
  AFFILIATION_NOT_FOUND: 'companies/affiliation-not-found',
  AFFILIATION_ALREADY_REVIEWED: 'companies/affiliation-already-reviewed',
  TENANT_FORBIDDEN: 'companies/tenant-forbidden',
  LOCAL_IMAGE_NOT_FOUND: 'companies/local-image-not-found',
  UPLOAD_NOT_FOUND: 'companies/upload-not-found',
  INVALID_UPLOAD: 'companies/invalid-upload',
} as const;

export type CompaniesErrorCode =
  (typeof COMPANIES_ERROR_CODES)[keyof typeof COMPANIES_ERROR_CODES];
