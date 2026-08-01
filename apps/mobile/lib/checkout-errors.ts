import { CHECKOUT_ERROR_CODES } from '@urnight/contracts';
import { ApiError, NetworkError } from './errors';

/**
 * Copy de UX por código de dominio del checkout (SD-05). Los códigos vienen de
 * `@urnight/contracts`, nunca escritos a mano: si el backend renombra uno, esto
 * deja de compilar.
 */
const MESSAGES: Record<string, string> = {
  [CHECKOUT_ERROR_CODES.EVENT_NOT_ON_SALE]: 'Este evento ya no está a la venta.',
  [CHECKOUT_ERROR_CODES.TICKET_TYPE_NOT_FOUND]: 'Ese tramo ya no existe.',
  [CHECKOUT_ERROR_CODES.TICKET_TYPE_UNAVAILABLE]: 'Ese tramo no está disponible ahora mismo.',
  [CHECKOUT_ERROR_CODES.INSUFFICIENT_STOCK]: 'Ya no quedan entradas suficientes en este tramo.',
  [CHECKOUT_ERROR_CODES.INSUFFICIENT_CAPACITY]: 'El local llegó a su aforo para esta noche.',
  [CHECKOUT_ERROR_CODES.HOLD_NOT_FOUND]: 'Tu reserva de cupo se perdió. Vuelve a intentarlo.',
  [CHECKOUT_ERROR_CODES.HOLD_EXPIRED]: 'Tu reserva de cupo expiró. Vuelve a intentarlo.',
  [CHECKOUT_ERROR_CODES.HOLD_UNAVAILABLE]: 'Tu reserva de cupo ya no es válida.',
  [CHECKOUT_ERROR_CODES.MAX_PER_USER_EXCEEDED]: 'Superaste el máximo de entradas por persona.',
  [CHECKOUT_ERROR_CODES.PAYMENT_REJECTED]: 'El pago fue rechazado. Prueba con otro método.',
  [CHECKOUT_ERROR_CODES.ATTENDEE_UNDERAGE]: 'Todos los asistentes deben ser mayores de 18 años.',
  [CHECKOUT_ERROR_CODES.STOCK_LOCKED]:
    'Hay mucha demanda en este tramo. Inténtalo en unos segundos.',
};

/** Traduce el fallo a copy de UX. */
export function checkoutMessageOf(err: unknown): string {
  if (err instanceof NetworkError) {
    return 'Sin conexión. Revisa tu red e inténtalo de nuevo.';
  }
  if (err instanceof ApiError) {
    const known = err.code ? MESSAGES[err.code] : undefined;
    if (known) return known;
    if (err.status === 401) return 'Tu sesión expiró. Vuelve a ingresar.';
  }
  return 'No pudimos completar la compra. Inténtalo de nuevo.';
}

/**
 * Solo se reintenta lo que NO tuvo respuesta del servidor. Un 409 o un 402 son
 * veredictos: reintentarlos no cambia nada y confunde al usuario.
 */
export function isRetryable(err: unknown): boolean {
  return err instanceof NetworkError;
}
