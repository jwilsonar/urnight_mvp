export interface TotpPort {
  generateSecret(): string;
  buildOtpAuthUri(secret: string, accountLabel: string): string;
  /** TOTP SHA-1, seis dígitos, paso de 30 s y ventana de ±1 paso. */
  verify(secret: string, code: string): boolean;
}

export const TOTP_PORT = Symbol('TOTP_PORT');
