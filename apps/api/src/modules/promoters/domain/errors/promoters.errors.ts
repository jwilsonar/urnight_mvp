import { PROMOTERS_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

export class PromoterNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = PROMOTERS_ERROR_CODES.PROMOTER_NOT_FOUND;
  constructor() {
    super('Promotor no encontrado.');
  }
}

export class ApplicationNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = PROMOTERS_ERROR_CODES.APPLICATION_NOT_FOUND;
  constructor() {
    super('Postulación no encontrada.');
  }
}

export class ApplicationAlreadyReviewedError extends DomainError {
  readonly status = 409;
  readonly code = PROMOTERS_ERROR_CODES.APPLICATION_ALREADY_REVIEWED;
  constructor() {
    super('La postulación ya fue revisada.');
  }
}

export class PromoCodeNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = PROMOTERS_ERROR_CODES.PROMO_CODE_NOT_FOUND;
  constructor() {
    super('Código promocional no encontrado.');
  }
}

export class PromoCodeInvalidError extends DomainError {
  readonly status = 422;
  readonly code = PROMOTERS_ERROR_CODES.PROMO_CODE_INVALID;
  constructor(reason: string) {
    super(reason);
  }
}

export class PromoCodeCodeTakenError extends DomainError {
  readonly status = 409;
  readonly code = PROMOTERS_ERROR_CODES.PROMO_CODE_CODE_TAKEN;
  constructor() {
    super('El código promocional ya existe.');
  }
}

export class AssociationNotPendingError extends DomainError {
  readonly status = 409;
  readonly code = PROMOTERS_ERROR_CODES.ASSOCIATION_NOT_PENDING;
  constructor() {
    super('La asociación ya no está pendiente.');
  }
}

export class AssociationForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = PROMOTERS_ERROR_CODES.ASSOCIATION_FORBIDDEN;
  constructor() {
    super('Esta invitación de promotor no corresponde a tu cuenta.');
  }
}

export class PromoterEventNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = PROMOTERS_ERROR_CODES.PROMOTER_EVENT_NOT_FOUND;
  constructor() {
    super('Asignación de evento no encontrada.');
  }
}

export class AllocationNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = PROMOTERS_ERROR_CODES.ALLOCATION_NOT_FOUND;
  constructor() {
    super('Este tipo de entrada no está asignado al promotor.');
  }
}

export class AllocationExhaustedError extends DomainError {
  readonly status = 409;
  readonly code = PROMOTERS_ERROR_CODES.ALLOCATION_EXHAUSTED;
  constructor() {
    super('Cupo agotado: no quedan entradas por repartir para este tipo.');
  }
}

export class AllocationExceedsStockError extends DomainError {
  readonly status = 422;
  readonly code = PROMOTERS_ERROR_CODES.ALLOCATION_EXCEEDS_STOCK;
  constructor() {
    super('El cupo no puede superar las entradas disponibles del tipo.');
  }
}

export class AssignmentForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = PROMOTERS_ERROR_CODES.ASSIGNMENT_FORBIDDEN;
  constructor() {
    super('Esta asignación no corresponde a tu cuenta.');
  }
}
