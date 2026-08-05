import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { Env } from '../../../../config/env.schema';

const VERSION = 'v1';
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** Cifrado autenticado del secreto TOTP en reposo (AES-256-GCM). */
@Injectable()
export class AesGcmSecretCipher {
  constructor(private readonly config: ConfigService<Env, true>) {}

  encrypt(secret: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv, { authTagLength: TAG_BYTES });
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64url'), encrypted.toString('base64url'), tag.toString('base64url')].join('.');
  }

  decrypt(payload: string): string {
    const [version, ivValue, encryptedValue, tagValue, extra] = payload.split('.');
    if (version !== VERSION || !ivValue || !encryptedValue || !tagValue || extra) {
      throw new Error('Secreto MFA cifrado inválido');
    }
    const iv = Buffer.from(ivValue, 'base64url');
    const encrypted = Buffer.from(encryptedValue, 'base64url');
    const tag = Buffer.from(tagValue, 'base64url');
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error('Secreto MFA cifrado inválido');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key(), iv, { authTagLength: TAG_BYTES });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private key(): Buffer {
    const encoded = this.config.get('MFA_ENCRYPTION_KEY', { infer: true });
    if (!encoded) throw new Error('MFA_ENCRYPTION_KEY no está configurada');
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== 32) {
      throw new Error('MFA_ENCRYPTION_KEY debe ser una clave de 32 bytes codificada en Base64');
    }
    return key;
  }
}
