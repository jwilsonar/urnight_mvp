import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Env } from '../../../../config/env.schema';
import { AesGcmSecretCipher } from './aes-gcm-secret-cipher';

// El TOTP se prueba en node-totp.adapter.spec.ts, con los vectores de la RFC
// 6238 y los casos de reloj desfasado.
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
