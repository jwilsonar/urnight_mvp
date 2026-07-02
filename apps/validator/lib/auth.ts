import * as SecureStore from 'expo-secure-store';
import { createLogger } from './logger';

/**
 * Sesión del validador (§5): el access token JWT emitido por la API se guarda
 * en almacenamiento seguro del dispositivo (expo-secure-store, Keychain/Keystore)
 * y se adjunta a cada `validateQr`. La API exige rol `validator`; aquí sólo
 * decodificamos el payload para gating de UX (el servidor verifica la firma).
 */
const log = createLogger('auth');
const TOKEN_KEY = 'urnight_validator_access_token';

/** La cuenta autenticó pero no tiene rol `validator` → no puede validar en puerta. */
export class NotValidatorError extends Error {
  constructor() {
    super('not_validator');
    this.name = 'NotValidatorError';
  }
}

interface AccessClaims {
  sub?: string;
  roles?: string[];
  exp?: number;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodifica base64url → JSON sin depender de atob/Buffer (portable en RN/Hermes). */
function decodeSegment(seg: string): AccessClaims | null {
  try {
    const norm = seg.replace(/-/g, '+').replace(/_/g, '/');
    let bytes = '';
    let buffer = 0;
    let bits = 0;
    for (const ch of norm) {
      const idx = B64.indexOf(ch);
      if (idx === -1) continue;
      buffer = (buffer << 6) | idx;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    const json = decodeURIComponent(
      bytes
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as AccessClaims;
  } catch {
    return null;
  }
}

function claimsOf(token: string): AccessClaims | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  return decodeSegment(payload);
}

/** ¿El token porta rol `validator` y no está expirado? (verificación local de UX). */
export function isValidatorToken(token: string | null | undefined): token is string {
  if (!token) return false;
  const claims = claimsOf(token);
  if (!claims?.roles?.includes('validator')) return false;
  if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) return false;
  return true;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'validator.auth.read_failed');
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'validator.auth.clear_failed');
  }
}
