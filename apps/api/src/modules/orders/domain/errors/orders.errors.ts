import { ORDERS_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

export class OrdersLocalNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = ORDERS_ERROR_CODES.LOCAL_NOT_FOUND;
  constructor() {
    super('Local no encontrado.');
  }
}

export class LocalOrderNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = ORDERS_ERROR_CODES.ORDER_NOT_FOUND;
  constructor() {
    super('Pedido no encontrado.');
  }
}

export class InvalidOrderStatusTransitionError extends DomainError {
  readonly status = 409;
  readonly code = ORDERS_ERROR_CODES.INVALID_STATUS_TRANSITION;
  constructor() {
    super('La transición de estado del pedido no es válida.');
  }
}

export class OrderStatusAdvanceForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = ORDERS_ERROR_CODES.STATUS_ADVANCE_FORBIDDEN;
  constructor() {
    super('Solo el personal de barra puede avanzar pedidos.');
  }
}

export class LocalOrderAlreadyPaidError extends DomainError {
  readonly status = 409;
  readonly code = ORDERS_ERROR_CODES.ORDER_ALREADY_PAID;
  constructor() {
    super('El pedido ya está pagado.');
  }
}

export class LocalOrderPaymentRejectedError extends DomainError {
  readonly status = 402;
  readonly code = ORDERS_ERROR_CODES.PAYMENT_REJECTED;
  constructor(reason?: string) {
    super(reason ?? 'El pago fue rechazado.');
  }
}

export class LocalOrderSplitNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = ORDERS_ERROR_CODES.SPLIT_NOT_FOUND;
  constructor() {
    super('División de cuenta no encontrada.');
  }
}

export class LocalOrderSplitOverpaidError extends DomainError {
  readonly status = 409;
  readonly code = ORDERS_ERROR_CODES.SPLIT_OVERPAID;
  constructor() {
    super('El pago supera el monto pendiente de la cuenta dividida.');
  }
}

export class OrderWindowClosedError extends DomainError {
  readonly status = 409;
  readonly code = ORDERS_ERROR_CODES.ORDER_WINDOW_CLOSED;
  constructor() {
    super('El local no acepta pedidos en este horario.');
  }
}

export class OrderProductUnavailableError extends DomainError {
  readonly status = 409;
  readonly code = ORDERS_ERROR_CODES.PRODUCT_UNAVAILABLE;
  constructor() {
    super('Uno de los productos no está disponible.');
  }
}
