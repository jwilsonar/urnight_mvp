import { EVENTS_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

export class EventNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = EVENTS_ERROR_CODES.EVENT_NOT_FOUND;
  constructor() {
    super('Evento no encontrado.');
  }
}

export class EventSlugTakenError extends DomainError {
  readonly status = 409;
  readonly code = EVENTS_ERROR_CODES.EVENT_SLUG_TAKEN;
  constructor() {
    super('El slug de evento ya está en uso.');
  }
}

export class EventNotPublishableError extends DomainError {
  readonly status = 409;
  readonly code = EVENTS_ERROR_CODES.EVENT_NOT_PUBLISHABLE;
  constructor() {
    super('El evento no puede publicarse en su estado actual.');
  }
}

export class TicketTypeNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = EVENTS_ERROR_CODES.TICKET_TYPE_NOT_FOUND;
  constructor() {
    super('Tipo de entrada no encontrado.');
  }
}

/** Flyer subido inválido (no es staging, supera tamaño o tipo no permitido). */
export class EventFlyerInvalidError extends DomainError {
  readonly status = 400;
  readonly code = EVENTS_ERROR_CODES.EVENT_FLYER_INVALID;
  constructor(message = 'El flyer subido no es válido.') {
    super(message);
  }
}

/** La key de staging del flyer no existe (no se subió o expiró). */
export class EventFlyerNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = EVENTS_ERROR_CODES.EVENT_FLYER_NOT_FOUND;
  constructor() {
    super('La imagen subida no se encontró. Vuelve a subirla.');
  }
}
