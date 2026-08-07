/**
 * Resultado de verificar un código TOTP.
 *
 * `driftSeconds` distingue dos fallos que el usuario vivía igual pero se
 * arreglan distinto: un código realmente equivocado (`null`) y un código
 * correcto para otro instante, que solo pasa cuando el reloj del servidor está
 * desfasado respecto al del autenticador.
 */
export type TotpVerification =
  | { valid: true }
  | { valid: false; driftSeconds: number | null };

export interface TotpPort {
  generateSecret(): string;
  buildOtpAuthUri(secret: string, accountLabel: string): string;
  /** TOTP SHA-1, seis dígitos y paso de 30 s. La ventana la define el adapter. */
  verify(secret: string, code: string): TotpVerification;
}

export const TOTP_PORT = Symbol('TOTP_PORT');
