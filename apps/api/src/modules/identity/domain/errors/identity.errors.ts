import { IDENTITY_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

/** Email ya registrado (UNIQUE USER.email). */
export class EmailAlreadyRegisteredError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.EMAIL_ALREADY_REGISTERED;
  constructor() {
    super('El email ya está registrado.');
  }
}

/** Credenciales inválidas (login). Mensaje genérico para no filtrar existencia. */
export class InvalidCredentialsError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.INVALID_CREDENTIALS;
  constructor() {
    super('Email o contraseña incorrectos.');
  }
}

export class UserNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = IDENTITY_ERROR_CODES.USER_NOT_FOUND;
  constructor() {
    super('Usuario no encontrado.');
  }
}

/** Menor de 18 (§4.3). */
export class UnderageError extends DomainError {
  readonly status = 422;
  readonly code = IDENTITY_ERROR_CODES.UNDERAGE;
  constructor() {
    super('Debe ser mayor de 18 años.');
  }
}

export class DocumentAlreadyRegisteredError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.DOCUMENT_ALREADY_REGISTERED;
  constructor() {
    super('El número de documento ya está registrado.');
  }
}

/** Documento inmutable una vez asignado (§ invariante; lock tras compra en Checkout). */
export class DocumentLockedError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.DOCUMENT_LOCKED;
  constructor() {
    super('El documento ya fue asignado y no puede modificarse.');
  }
}

export class AccountDisabledError extends DomainError {
  readonly status = 403;
  readonly code = IDENTITY_ERROR_CODES.ACCOUNT_DISABLED;
  constructor() {
    super('La cuenta está deshabilitada.');
  }
}

export class RoleNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = IDENTITY_ERROR_CODES.ROLE_NOT_FOUND;
  constructor() {
    super('Rol no encontrado.');
  }
}

export class RoleAlreadyGrantedError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.ROLE_ALREADY_GRANTED;
  constructor() {
    super('El usuario ya tiene ese rol en ese scope.');
  }
}

export class RoleAssignmentNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = IDENTITY_ERROR_CODES.ROLE_ASSIGNMENT_NOT_FOUND;
  constructor() {
    super('Asignación de rol no encontrada.');
  }
}

export class LegalDocumentNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = IDENTITY_ERROR_CODES.LEGAL_DOCUMENT_NOT_FOUND;
  constructor() {
    super('Documento legal no encontrado.');
  }
}

export class PreferenceNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = IDENTITY_ERROR_CODES.PREFERENCE_NOT_FOUND;
  constructor() {
    super('Preferencias no encontradas.');
  }
}

export class FavoriteAlreadyExistsError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.FAVORITE_ALREADY_EXISTS;
  constructor() {
    super('El elemento ya está en favoritos.');
  }
}

export class FavoriteNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = IDENTITY_ERROR_CODES.FAVORITE_NOT_FOUND;
  constructor() {
    super('Favorito no encontrado.');
  }
}

export class GoogleTokenInvalidError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.GOOGLE_TOKEN_INVALID;
  constructor() {
    super('El token de Google es inválido.');
  }
}

export class InvalidTokenError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.INVALID_TOKEN;
  constructor() {
    super('Token inválido o expirado.');
  }
}

/**
 * Login Google con email no verificado por el IdP (M4). Se rechaza antes de
 * enlazar/crear cuenta para evitar account-takeover / pre-hijacking al vincular
 * a una cuenta email+password preexistente.
 */
export class GoogleEmailNotVerifiedError extends DomainError {
  readonly status = 403;
  readonly code = IDENTITY_ERROR_CODES.GOOGLE_EMAIL_NOT_VERIFIED;
  constructor() {
    super('El email de la cuenta de Google no está verificado.');
  }
}

export class MfaRequiredError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.MFA_REQUIRED;
  constructor() {
    super('Debes completar el enrolamiento MFA para continuar.');
  }
}

export class MfaAlreadyEnrolledError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.MFA_ALREADY_ENROLLED;
  constructor() {
    super('El usuario ya tiene MFA activo.');
  }
}

export class MfaNotEnrolledError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.MFA_NOT_ENROLLED;
  constructor() {
    super('El usuario no tiene MFA activo.');
  }
}

export class InvalidMfaCodeError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.INVALID_MFA_CODE;
  constructor() {
    super('El código MFA es inválido.');
  }
}

export class MfaChallengeExpiredError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.MFA_CHALLENGE_EXPIRED;
  constructor() {
    super('El desafío MFA expiró o ya fue utilizado.');
  }
}

export class MfaLockedError extends DomainError {
  readonly status = 429;
  readonly code = IDENTITY_ERROR_CODES.MFA_LOCKED;
  constructor() {
    super('El desafío MFA fue bloqueado por demasiados intentos.');
  }
}

/**
 * El código era el correcto para otro instante: el reloj del servidor no
 * coincide con el del autenticador. No es culpa de quien ingresa el código, así
 * que no se responde "código inválido" — se nombra la causa y se pide arreglar
 * la hora del servidor.
 */
export class MfaClockDriftError extends DomainError {
  readonly status = 503;
  readonly code = IDENTITY_ERROR_CODES.MFA_CLOCK_DRIFT;
  constructor(readonly driftSeconds: number) {
    super(
      `El reloj del servidor está desfasado ${Math.round(driftSeconds)} s respecto al de tu ` +
        'autenticador. El código es correcto, pero no se puede validar hasta sincronizar la hora.',
    );
  }
}

/**
 * El secreto TOTP guardado no se puede descifrar (típicamente porque cambió
 * MFA_ENCRYPTION_KEY). El factor quedó inservible y hay que volver a enrolar.
 */
export class MfaFactorUnreadableError extends DomainError {
  readonly status = 409;
  readonly code = IDENTITY_ERROR_CODES.MFA_FACTOR_UNREADABLE;
  constructor() {
    super(
      'El factor MFA guardado no se puede leer con la clave actual del servidor. ' +
        'Hay que revocarlo y volver a enrolarlo.',
    );
  }
}

export class MfaEmailUnavailableError extends DomainError {
  readonly status = 403;
  readonly code = IDENTITY_ERROR_CODES.MFA_EMAIL_UNAVAILABLE;
  constructor() {
    super('El segundo factor por correo requiere un email verificado.');
  }
}

export class MfaEmailCodeInvalidError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.MFA_EMAIL_CODE_INVALID;
  constructor() {
    super('El código MFA enviado por correo es inválido.');
  }
}

export class MfaEmailCodeExpiredError extends DomainError {
  readonly status = 401;
  readonly code = IDENTITY_ERROR_CODES.MFA_EMAIL_CODE_EXPIRED;
  constructor() {
    super('El código MFA enviado por correo expiró o ya fue utilizado.');
  }
}

export class MfaEmailResendTooSoonError extends DomainError {
  readonly status = 429;
  readonly code = IDENTITY_ERROR_CODES.MFA_EMAIL_RESEND_TOO_SOON;
  constructor() {
    super('Debes esperar antes de solicitar otro código por correo.');
  }
}
