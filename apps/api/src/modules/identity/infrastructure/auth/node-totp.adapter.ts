import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { TotpPort } from '../../domain/ports/totp.port';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

@Injectable()
export class NodeTotpAdapter implements TotpPort {
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

  verify(secret: string, code: string): boolean {
    if (!/^\d{6}$/.test(code)) return false;
    const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);
    const supplied = Buffer.from(code, 'ascii');
    let valid = false;
    for (const offset of [-1, 0, 1]) {
      const expected = Buffer.from(hotp(secret, counter + offset), 'ascii');
      valid = timingSafeEqual(expected, supplied) || valid;
    }
    return valid;
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
