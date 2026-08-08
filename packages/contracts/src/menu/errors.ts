/** Códigos machine-readable del catálogo y configuración de carta. */
export const MENU_ERROR_CODES = {
  /** El local no existe, o el actor no puede verlo por su scope de empresa. */
  LOCAL_NOT_FOUND: 'menu/local-not-found',
  CATEGORY_NOT_FOUND: 'menu/category-not-found',
  PRODUCT_NOT_FOUND: 'menu/product-not-found',
  PRICE_NOT_FOUND: 'menu/price-not-found',
  ORDER_WINDOW_INVALID: 'menu/order-window-invalid',
  DEPOSIT_PERCENT_INVALID: 'menu/deposit-percent-invalid',
} as const;

export type MenuErrorCode = (typeof MENU_ERROR_CODES)[keyof typeof MENU_ERROR_CODES];
