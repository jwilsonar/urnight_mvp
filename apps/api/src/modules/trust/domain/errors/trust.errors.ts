import { TRUST_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

export class ReviewNotEligibleError extends DomainError {
  readonly status = 403;
  readonly code = TRUST_ERROR_CODES.REVIEW_NOT_ELIGIBLE;
  constructor() {
    super('Solo puedes reseñar con una entrada usada de ese local/evento.');
  }
}

export class ReportNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = TRUST_ERROR_CODES.REPORT_NOT_FOUND;
  constructor() {
    super('Reporte no encontrado.');
  }
}
