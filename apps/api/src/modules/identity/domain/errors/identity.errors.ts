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
