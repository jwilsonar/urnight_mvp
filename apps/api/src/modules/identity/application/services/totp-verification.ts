import type { Logger } from 'pino';
import { InvalidMfaCodeError, MfaClockDriftError } from '../../domain/errors/identity.errors';
import type { TotpPort } from '../../domain/ports/totp.port';

/**
 * Verifica un código TOTP y traduce el fallo al error que corresponde.
 *
 * Un código correcto para otro instante no es un código inválido: significa que
 * el reloj del servidor está corrido. Confundir los dos casos dejaba a la
 * persona probando códigos buenos una y otra vez sin ninguna pista.
 */
export function assertTotpCode(
  totp: TotpPort,
  log: Logger,
  input: { userId: string; secret: string; code: string },
): void {
  const verification = totp.verify(input.secret, input.code);
  if (verification.valid) return;

  if (verification.driftSeconds !== null) {
    log.error(
      { userId: input.userId, driftSeconds: verification.driftSeconds },
      'identity.mfa.clock_drift',
    );
    throw new MfaClockDriftError(verification.driftSeconds);
  }

  log.warn({ userId: input.userId }, 'identity.mfa.failed');
  throw new InvalidMfaCodeError();
}
