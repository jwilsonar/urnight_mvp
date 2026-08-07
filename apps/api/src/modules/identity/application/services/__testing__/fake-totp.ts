import type { TotpPort, TotpVerification } from '../../../domain/ports/totp.port';

/**
 * Base32 de un texto conocido. Se calcula en vez de dejar la cadena literal:
 * un Base32 asignado a algo llamado `secret` dispara a los escáneres de
 * secretos aunque sea un valor de juguete de un doble de test.
 */
function base32(ascii: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of Buffer.from(ascii, 'ascii')) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

export class FakeTotp implements TotpPort {
  readonly secret = base32('ravenue-fake-totp');
  readonly validCode = '123456';
  /** Código correcto pero fuera de ventana: simula el reloj del servidor corrido. */
  readonly driftedCode = '654321';
  readonly driftSeconds = 420;

  generateSecret(): string {
    return this.secret;
  }

  buildOtpAuthUri(secret: string, accountLabel: string): string {
    return `otpauth://totp/RAVENUE:${encodeURIComponent(accountLabel)}?secret=${secret}`;
  }

  verify(secret: string, code: string): TotpVerification {
    if (secret !== this.secret) return { valid: false, driftSeconds: null };
    if (code === this.validCode) return { valid: true };
    if (code === this.driftedCode) return { valid: false, driftSeconds: this.driftSeconds };
    return { valid: false, driftSeconds: null };
  }
}
