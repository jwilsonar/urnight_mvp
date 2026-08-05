import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../../config/env.schema';
import { AesGcmSecretCipher } from './aes-gcm-secret-cipher';
import { NodeTotpAdapter } from './node-totp.adapter';

afterEach(() => vi.useRealTimers());

describe('NodeTotpAdapter', () => {
  it('verifica TOTP SHA-1 de seis dígitos con ventana ±1 de 30 segundos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(59_000));
    const totp = new NodeTotpAdapter();
    const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

    expect(totp.verify(rfcSecret, '287082')).toBe(true);
    vi.setSystemTime(new Date(89_000));
    expect(totp.verify(rfcSecret, '287082')).toBe(true);
    vi.setSystemTime(new Date(120_000));
    expect(totp.verify(rfcSecret, '287082')).toBe(false);
  });

  it('genera secreto Base32 y URI compatible con aplicaciones autenticadoras', () => {
    const totp = new NodeTotpAdapter();
    const secret = totp.generateSecret();

    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(totp.buildOtpAuthUri(secret, 'ada@example.com')).toContain(
      `otpauth://totp/RAVENUE%3Aada%40example.com?secret=${secret}`,
    );
  });
});

describe('AesGcmSecretCipher', () => {
  const key = Buffer.alloc(32, 7).toString('base64');
  const config = {
    get: () => key,
  } as unknown as ConfigService<Env, true>;

  it('cifra y descifra sin almacenar el secreto en claro', () => {
    const cipher = new AesGcmSecretCipher(config);
    const encrypted = cipher.encrypt('JBSWY3DPEHPK3PXP');

    expect(encrypted).not.toContain('JBSWY3DPEHPK3PXP');
    expect(cipher.decrypt(encrypted)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('rechaza ciphertext manipulado', () => {
    const cipher = new AesGcmSecretCipher(config);
    const encrypted = cipher.encrypt('JBSWY3DPEHPK3PXP');
    const parts = encrypted.split('.');
    const ciphertext = parts[2] ?? '';
    parts[2] = `${ciphertext.startsWith('A') ? 'B' : 'A'}${ciphertext.slice(1)}`;

    expect(() => cipher.decrypt(parts.join('.'))).toThrow();
  });
});
