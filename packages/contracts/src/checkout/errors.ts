export const CHECKOUT_ERROR_CODES = {
  EVENT_NOT_ON_SALE: 'checkout/event-not-on-sale',
  TICKET_TYPE_NOT_FOUND: 'checkout/ticket-type-not-found',
  TICKET_TYPE_UNAVAILABLE: 'checkout/ticket-type-unavailable',
  INSUFFICIENT_STOCK: 'checkout/insufficient-stock',
  MAX_PER_USER_EXCEEDED: 'checkout/max-per-user-exceeded',
  ORDER_NOT_FOUND: 'checkout/order-not-found',
  ORDER_NOT_PAYABLE: 'checkout/order-not-payable',
  PAYMENT_REJECTED: 'checkout/payment-rejected',
  ATTENDEE_UNDERAGE: 'checkout/attendee-underage',
  STOCK_LOCKED: 'checkout/stock-locked',
  QR_VALIDATION_FORBIDDEN: 'checkout/qr-validation-forbidden',
} as const;

export type CheckoutErrorCode = (typeof CHECKOUT_ERROR_CODES)[keyof typeof CHECKOUT_ERROR_CODES];
