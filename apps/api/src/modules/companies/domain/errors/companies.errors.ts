import { COMPANIES_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

export class CompanyNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = COMPANIES_ERROR_CODES.COMPANY_NOT_FOUND;
  constructor() {
    super('Empresa no encontrada.');
  }
}

export class RucAlreadyRegisteredError extends DomainError {
  readonly status = 409;
  readonly code = COMPANIES_ERROR_CODES.RUC_ALREADY_REGISTERED;
  constructor() {
    super('El RUC ya está registrado.');
  }
}

export class LocalNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = COMPANIES_ERROR_CODES.LOCAL_NOT_FOUND;
  constructor() {
    super('Local no encontrado.');
  }
}

export class LocalSlugTakenError extends DomainError {
  readonly status = 409;
  readonly code = COMPANIES_ERROR_CODES.LOCAL_SLUG_TAKEN;
  constructor() {
    super('El slug de local ya está en uso.');
  }
}

export class VerificationNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = COMPANIES_ERROR_CODES.VERIFICATION_NOT_FOUND;
  constructor() {
    super('Verificación no encontrada.');
  }
}

export class VerificationDocumentNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = COMPANIES_ERROR_CODES.VERIFICATION_DOCUMENT_NOT_FOUND;
  constructor() {
    super('Documento de verificación no encontrado.');
  }
}

export class AffiliationNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = COMPANIES_ERROR_CODES.AFFILIATION_NOT_FOUND;
  constructor() {
    super('Solicitud de afiliación no encontrada.');
  }
}

export class AffiliationAlreadyReviewedError extends DomainError {
  readonly status = 409;
  readonly code = COMPANIES_ERROR_CODES.AFFILIATION_ALREADY_REVIEWED;
  constructor() {
    super('La solicitud ya fue revisada.');
  }
}

export class TenantForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = COMPANIES_ERROR_CODES.TENANT_FORBIDDEN;
  constructor() {
    super('No puedes operar sobre recursos de otra empresa.');
  }
}

export class LocalImageNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = COMPANIES_ERROR_CODES.LOCAL_IMAGE_NOT_FOUND;
  constructor() {
    super('Imagen de local no encontrada.');
  }
}

export class UploadNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = COMPANIES_ERROR_CODES.UPLOAD_NOT_FOUND;
  constructor() {
    super('La subida no existe o expiró. Vuelve a subir el archivo.');
  }
}

export class InvalidUploadError extends DomainError {
  readonly status = 422;
  readonly code = COMPANIES_ERROR_CODES.INVALID_UPLOAD;
  constructor(detail = 'El archivo subido no es válido.') {
    super(detail);
  }
}
