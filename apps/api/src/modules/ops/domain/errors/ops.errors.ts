import { OPS_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

export class SettingNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = OPS_ERROR_CODES.SETTING_NOT_FOUND;
  constructor() {
    super('Ajuste no encontrado.');
  }
}

export class SupportTicketNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = OPS_ERROR_CODES.SUPPORT_TICKET_NOT_FOUND;
  constructor() {
    super('Ticket de soporte no encontrado.');
  }
}
