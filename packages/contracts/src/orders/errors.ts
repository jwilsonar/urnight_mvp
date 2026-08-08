/** Códigos machine-readable del dominio de pedidos dentro del local. */
export const ORDERS_ERROR_CODES = {
  LOCAL_NOT_FOUND: 'orders/local-not-found',
  ORDER_NOT_FOUND: 'orders/order-not-found',
  INVALID_STATUS_TRANSITION: 'orders/invalid-status-transition',
  STATUS_ADVANCE_FORBIDDEN: 'orders/status-advance-forbidden',
  ORDER_ALREADY_PAID: 'orders/order-already-paid',
  PAYMENT_REJECTED: 'orders/payment-rejected',
  SPLIT_NOT_FOUND: 'orders/split-not-found',
  SPLIT_OVERPAID: 'orders/split-overpaid',
  ORDER_WINDOW_CLOSED: 'orders/order-window-closed',
  PRODUCT_UNAVAILABLE: 'orders/product-unavailable',
} as const;

export type OrdersErrorCode =
  (typeof ORDERS_ERROR_CODES)[keyof typeof ORDERS_ERROR_CODES];
