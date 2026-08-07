import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Env } from '../../../../config/env.schema';
import type { TotpPort, TotpVerification } from '../../domain/ports/totp.port';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;
/**
 * Rango que se recorre solo para *diagnosticar* (±10 min). Un código que cae
 * aquí pero fuera de la ventana aceptada no autentica: sirve para reportar que
 * el reloj del servidor está corrido, que era la causa real de los "código
 * inválido" con un autenticador bien configurado.
 */
const DIAGNOSTIC_STEPS = 20;

@Injectable()
export class NodeTotpAdapter implements TotpPort {
  private readonly windowSteps: number;

  constructor(config: ConfigService<Env, true>) {
    this.windowSteps = config.get('MFA_TOTP_WINDOW_STEPS', { infer: true }) ?? 2;
  }

  generateSecret(): string {
    return encodeBase32(randomBytes(20));
  }

  buildOtpAuthUri(secret: string, accountLabel: string): string {
    const label = encodeURIComponent(`RAVENUE:${accountLabel}`);
    const params = new URLSearchParams({
      secret,
      issuer: 'RAVENUE',
      algorithm: 'SHA1',
      digits: String(DIGITS),
      period: String(STEP_SECONDS),
    });
    return `otpauth://totp/${label}?${params.toString()}`;
  }

  verify(secret: string, code: string): TotpVerification {
    if (!/^\d{6}$/.test(code)) return { valid: false, driftSeconds: null };
    const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);
    const supplied = Buffer.from(code, 'ascii');

    let valid = false;
    for (let offset = -this.windowSteps; offset <= this.windowSteps; offset += 1) {
      const expected = Buffer.from(hotp(secret, counter + offset), 'ascii');
      // Sin cortocircuito: el tiempo de respuesta no debe delatar cuántos pasos
      // se probaron antes de acertar.
      valid = timingSafeEqual(expected, supplied) || valid;
    }
    if (valid) return { valid: true };

    return { valid: false, driftSeconds: this.estimateDrift(secret, supplied, counter) };
  }

  /**
   * Busca el código fuera de la ventana aceptada. Devuelve el desfase en
   * segundos (positivo = el reloj del servidor va adelantado) o `null` si el
   * código simplemente no corresponde a este secreto.
   */
  private estimateDrift(secret: string, supplied: Buffer, counter: number): number | null {
    for (let offset = -DIAGNOSTIC_STEPS; offset <= DIAGNOSTIC_STEPS; offset += 1) {
      if (Math.abs(offset) <= this.windowSteps) continue;
      const expected = Buffer.from(hotp(secret, counter + offset), 'ascii');
      if (timingSafeEqual(expected, supplied)) return -offset * STEP_SECONDS;
    }
    return null;
  }
}

function hotp(secret: string, counter: number): string {
  const counterBytes = Buffer.alloc(8);
  counterBytes.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counterBytes).digest();
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  const binary =
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    (((digest[offset + 1] ?? 0) & 0xff) << 16) |
    (((digest[offset + 2] ?? 0) & 0xff) << 8) |
    ((digest[offset + 3] ?? 0) & 0xff);
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

function encodeBase32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
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

function decodeBase32(value: string): Buffer {
  const normalized = value.replace(/=+$/u, '').toUpperCase();
  let bits = 0;
  let accumulator = 0;
  const output: number[] = [];
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Secreto TOTP Base32 inválido');
    accumulator = (accumulator << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((accumulator >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}
