import { CHECKOUT_ERROR_CODES } from '@urnight/contracts';
import { describe, expect, it } from 'vitest';
import { checkoutMessageOf, isRetryable } from './checkout-errors';
import { ApiError, NetworkError } from './errors';

describe('isRetryable', () => {
  it('reintenta un fallo de red', () => {
    expect(isRetryable(new NetworkError())).toBe(true);
  });

  it('NO reintenta una respuesta del servidor', () => {
    expect(isRetryable(new ApiError(409, { code: CHECKOUT_ERROR_CODES.STOCK_LOCKED }))).toBe(
      false,
    );
    expect(isRetryable(new ApiError(402, { code: CHECKOUT_ERROR_CODES.PAYMENT_REJECTED }))).toBe(
      false,
    );
    expect(isRetryable(new ApiError(500))).toBe(false);
  });

  it('NO reintenta un error desconocido', () => {
    expect(isRetryable(new Error('boom'))).toBe(false);
  });
});

describe('checkoutMessageOf', () => {
  it('traduce el stock agotado', () => {
    const msg = checkoutMessageOf(
      new ApiError(409, { code: CHECKOUT_ERROR_CODES.INSUFFICIENT_STOCK }),
    );
    expect(msg).toContain('entradas');
  });

  it('traduce el pago rechazado', () => {
    const msg = checkoutMessageOf(
      new ApiError(402, { code: CHECKOUT_ERROR_CODES.PAYMENT_REJECTED }),
    );
    expect(msg).toContain('pago');
  });

  it('traduce el hold expirado', () => {
    const msg = checkoutMessageOf(new ApiError(409, { code: CHECKOUT_ERROR_CODES.HOLD_EXPIRED }));
    expect(msg).toContain('reserva');
  });

  it('traduce el asistente menor de edad', () => {
    const msg = checkoutMessageOf(
      new ApiError(422, { code: CHECKOUT_ERROR_CODES.ATTENDEE_UNDERAGE }),
    );
    expect(msg).toContain('18');
  });

  it('da un mensaje de red para NetworkError', () => {
    expect(checkoutMessageOf(new NetworkError())).toContain('conexión');
  });

  it('cae a un mensaje genérico ante un código desconocido', () => {
    expect(checkoutMessageOf(new ApiError(500, { code: 'ops/boom' }))).toBe(
      'No pudimos completar la compra. Inténtalo de nuevo.',
    );
  });
});
