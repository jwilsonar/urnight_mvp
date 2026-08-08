import { MENU_ERROR_CODES } from '@urnight/contracts';
import { DomainError } from '../../../../shared/errors/domain-error';

/**
 * El local al que se le pide la carta no existe o pertenece a otra empresa. Vive
 * aquí y no se reusa el de `companies` para no acoplar los dos contextos: el
 * único punto de contacto entre módulos es el `ResourceTenantResolver`.
 */
export class MenuLocalNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = MENU_ERROR_CODES.LOCAL_NOT_FOUND;
  constructor() {
    super('Local no encontrado.');
  }
}

export class MenuCategoryNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = MENU_ERROR_CODES.CATEGORY_NOT_FOUND;
  constructor() {
    super('Categoría de carta no encontrada.');
  }
}

export class MenuProductNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = MENU_ERROR_CODES.PRODUCT_NOT_FOUND;
  constructor() {
    super('Producto de carta no encontrado.');
  }
}

export class MenuPriceNotFoundError extends DomainError {
  readonly status = 404;
  readonly code = MENU_ERROR_CODES.PRICE_NOT_FOUND;
  constructor() {
    super('El producto no tiene un precio vigente.');
  }
}

export class MenuOrderWindowInvalidError extends DomainError {
  readonly status = 422;
  readonly code = MENU_ERROR_CODES.ORDER_WINDOW_INVALID;
  constructor() {
    super('El horario de pedidos no es válido.');
  }
}

export class MenuDepositPercentInvalidError extends DomainError {
  readonly status = 422;
  readonly code = MENU_ERROR_CODES.DEPOSIT_PERCENT_INVALID;
  constructor() {
    super('El porcentaje de depósito debe ser múltiplo de 5 entre 0 y 100.');
  }
}
