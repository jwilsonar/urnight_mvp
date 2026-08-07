/**
 * Códigos de error de dominio de Identity (machine-readable, compartidos front/back).
 * La API los expone en `type`/`code` del Problem+JSON (RFC 7807). El dominio del
 * backend lanza subclases de DomainError portando estos códigos + status HTTP.
 */
export const IDENTITY_ERROR_CODES = {
  EMAIL_ALREADY_REGISTERED: 'identity/email-already-registered',
  INVALID_CREDENTIALS: 'identity/invalid-credentials',
  USER_NOT_FOUND: 'identity/user-not-found',
  UNDERAGE: 'identity/underage',
  DOCUMENT_ALREADY_REGISTERED: 'identity/document-already-registered',
  DOCUMENT_LOCKED: 'identity/document-locked',
  ACCOUNT_DISABLED: 'identity/account-disabled',
  ROLE_NOT_FOUND: 'identity/role-not-found',
  ROLE_ALREADY_GRANTED: 'identity/role-already-granted',
  ROLE_ASSIGNMENT_NOT_FOUND: 'identity/role-assignment-not-found',
  LEGAL_DOCUMENT_NOT_FOUND: 'identity/legal-document-not-found',
  PREFERENCE_NOT_FOUND: 'identity/preference-not-found',
  FAVORITE_ALREADY_EXISTS: 'identity/favorite-already-exists',
  FAVORITE_NOT_FOUND: 'identity/favorite-not-found',
  GOOGLE_TOKEN_INVALID: 'identity/google-token-invalid',
  GOOGLE_EMAIL_NOT_VERIFIED: 'identity/google-email-not-verified',
  INVALID_TOKEN: 'identity/invalid-token',
  MFA_REQUIRED: 'identity/mfa-required',
  MFA_ALREADY_ENROLLED: 'identity/mfa-already-enrolled',
  MFA_NOT_ENROLLED: 'identity/mfa-not-enrolled',
  INVALID_MFA_CODE: 'identity/invalid-mfa-code',
  MFA_CHALLENGE_EXPIRED: 'identity/mfa-challenge-expired',
  MFA_LOCKED: 'identity/mfa-locked',
  /** El código era correcto para otro instante: el reloj del servidor está desfasado. */
  MFA_CLOCK_DRIFT: 'identity/mfa-clock-drift',
  /** El secreto TOTP guardado no se puede descifrar (MFA_ENCRYPTION_KEY cambiada). */
  MFA_FACTOR_UNREADABLE: 'identity/mfa-factor-unreadable',
} as const;

export type IdentityErrorCode =
  (typeof IDENTITY_ERROR_CODES)[keyof typeof IDENTITY_ERROR_CODES];
