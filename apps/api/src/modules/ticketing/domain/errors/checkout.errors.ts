import { CHECKOUT_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

export class EventNotOnSaleError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.EVENT_NOT_ON_SALE;
  constructor() {
    super('El evento no está a la venta.');
  }
}

export class TicketTypeNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = CHECKOUT_ERROR_CODES.TICKET_TYPE_NOT_FOUND;
  constructor() {
    super('Tipo de entrada no encontrado.');
  }
}

export class TicketTypeUnavailableError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.TICKET_TYPE_UNAVAILABLE;
  constructor() {
    super('El tipo de entrada no está disponible.');
  }
}

export class InsufficientStockError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.INSUFFICIENT_STOCK;
  constructor() {
    super('Stock insuficiente para la cantidad solicitada.');
  }
}

export class InsufficientCapacityError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.INSUFFICIENT_CAPACITY;
  constructor() {
    super('No quedan cupos disponibles para esa cantidad. Elige una cantidad menor e inténtalo nuevamente.');
  }
}

export class HoldNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = CHECKOUT_ERROR_CODES.HOLD_NOT_FOUND;
  constructor() {
    super('La reserva temporal no existe o no pertenece a tu cuenta.');
  }
}

export class HoldExpiredError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.HOLD_EXPIRED;
  constructor() {
    super('Tu reserva temporal venció. Vuelve a seleccionar las entradas para continuar.');
  }
}

export class HoldUnavailableError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.HOLD_UNAVAILABLE;
  constructor() {
    super('La reserva temporal ya no está disponible para esta compra.');
  }
}

export class MaxPerUserExceededError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.MAX_PER_USER_EXCEEDED;
  constructor() {
    super('Excede el máximo de entradas por usuario.');
  }
}

export class OrderNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = CHECKOUT_ERROR_CODES.ORDER_NOT_FOUND;
  constructor() {
    super('Orden no encontrada.');
  }
}

export class OrderNotPayableError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.ORDER_NOT_PAYABLE;
  constructor() {
    super('La orden no puede pagarse en su estado actual.');
  }
}

export class PaymentRejectedError extends DomainError {
  readonly status = 402;
  readonly code = CHECKOUT_ERROR_CODES.PAYMENT_REJECTED;
  constructor(reason?: string) {
    super(reason ?? 'El pago fue rechazado.');
  }
}

export class AttendeeUnderageError extends DomainError {
  readonly status = 422;
  readonly code = CHECKOUT_ERROR_CODES.ATTENDEE_UNDERAGE;
  constructor() {
    super('Todos los asistentes deben ser mayores de 18 años.');
  }
}

export class StockLockedError extends DomainError {
  readonly status = 409;
  readonly code = CHECKOUT_ERROR_CODES.STOCK_LOCKED;
  constructor() {
    super('Compra en proceso para este evento, intenta de nuevo.');
  }
}

/**
 * C1: el validador intenta validar una entrada de un local/empresa fuera de su
 * scope multi-tenant (§4.3 "multi-tenant aislado"). 403 Forbidden.
 */
export class ValidatorScopeError extends DomainError {
  readonly status = 403;
  readonly code = CHECKOUT_ERROR_CODES.QR_VALIDATION_FORBIDDEN;
  constructor() {
    super('No tienes permiso para validar entradas de este local.');
  }
}
