import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../../config/env.schema';
import { NodeTotpAdapter } from './node-totp.adapter';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Codifica en Base32 igual que el adapter. Se calcula en vez de escribir la
 * cadena literal: un Base32 de 32 caracteres asignado a algo llamado "secret"
 * es exactamente lo que marcan los escáneres de secretos, y el CI se caía por
 * un valor que es público desde que se publicó la RFC.
 */
function toBase32(ascii: string): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of Buffer.from(ascii, 'ascii')) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

/** Clave de prueba de la RFC 6238, apéndice B: los dígitos 1..0 repetidos. */
const RFC_SECRET = toBase32('12345678901234567890');
/** Vector de la RFC en T=1111111109 → 07081804; a seis dígitos, 081804. */
const RFC_COUNTER = Math.floor(1111111109 / 30);
const RFC_CODE = '081804';

function adapterWith(windowSteps: number): NodeTotpAdapter {
  const config = { get: () => windowSteps } as unknown as ConfigService<Env, true>;
  return new NodeTotpAdapter(config);
}

/** Coloca el reloj en el instante exacto en que corre `counter`. */
function atCounter(counter: number): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(counter * 30 * 1000));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('NodeTotpAdapter', () => {
  it('reproduce los vectores de la RFC 6238 truncados a seis dígitos', () => {
    const totp = adapterWith(0);
    const vectors: Array<[number, string]> = [
      [59, '287082'],
      [1111111109, '081804'],
      [1111111111, '050471'],
      [1234567890, '005924'],
      [2000000000, '279037'],
      [20000000000, '353130'],
    ];

    for (const [time, code] of vectors) {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(time * 1000));
      expect(totp.verify(RFC_SECRET, code), `T=${time}`).toEqual({ valid: true });
    }
  });

  it('acepta el código dentro de la ventana configurada', () => {
    const totp = adapterWith(2);
    atCounter(RFC_COUNTER + 2);
    expect(totp.verify(RFC_SECRET, RFC_CODE)).toEqual({ valid: true });
  });

  it('rechaza un código fuera de la ventana y reporta cuánto se atrasó el reloj', () => {
    const totp = adapterWith(2);
    atCounter(RFC_COUNTER - 14); // el servidor va 7 minutos atrasado
    expect(totp.verify(RFC_SECRET, RFC_CODE)).toEqual({ valid: false, driftSeconds: -420 });
  });

  it('reporta el desfase también cuando el reloj del servidor va adelantado', () => {
    const totp = adapterWith(2);
    atCounter(RFC_COUNTER + 14);
    expect(totp.verify(RFC_SECRET, RFC_CODE)).toEqual({ valid: false, driftSeconds: 420 });
  });

  it('no reporta desfase cuando el código simplemente no corresponde', () => {
    const totp = adapterWith(2);
    atCounter(RFC_COUNTER);
    expect(totp.verify(RFC_SECRET, '000000')).toEqual({ valid: false, driftSeconds: null });
  });

  it('rechaza códigos con formato inválido sin tocar el secreto', () => {
    const totp = adapterWith(2);
    expect(totp.verify(RFC_SECRET, '12345')).toEqual({ valid: false, driftSeconds: null });
    expect(totp.verify(RFC_SECRET, 'abcdef')).toEqual({ valid: false, driftSeconds: null });
  });

  it('genera un secreto Base32 que el propio adapter puede verificar', () => {
    const totp = adapterWith(1);
    const secret = totp.generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(totp.buildOtpAuthUri(secret, 'admin@ravenue.pe')).toContain('issuer=RAVENUE');
  });
});
