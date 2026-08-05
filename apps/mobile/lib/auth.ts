import * as SecureStore from 'expo-secure-store';
import type { AuthTokensResponse } from '@urnight/contracts';
import { createLogger } from './logger';

/**
 * Sesión nativa del asistente (SD-02, §90-canales-moviles): el par de tokens
 * emitido por la API se guarda en almacenamiento seguro del dispositivo
 * (expo-secure-store, Keychain/Keystore). A diferencia del validador, aquí se
 * persiste TAMBIÉN el refresh token para renovar sesión sin re-login (§9 gap 4).
 * Los claims se decodifican sólo para gating de UX; la firma la verifica la API.
 */
const log = createLogger('auth');
const ACCESS_KEY = 'urnight_mobile_access_token';
const REFRESH_KEY = 'urnight_mobile_refresh_token';

export interface AccessClaims {
  sub?: string;
  email?: string;
  roles?: string[];
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
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

export function claimsOf(token: string | null | undefined): AccessClaims | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  return decodeSegment(payload);
}

/**
 * ¿El token sigue vigente? Margen de 30s igual que la web (SKEW_SECONDS en
 * apps/web/lib/auth.ts) para no usar un access a punto de expirar (SD-03).
 */
export function isTokenFresh(token: string | null | undefined, skewSeconds = 30): boolean {
  const claims = claimsOf(token);
  if (!claims) return false;
  if (typeof claims.exp !== 'number') return false;
  return (claims.exp - skewSeconds) * 1000 > Date.now();
}

export async function getStoredTokens(): Promise<TokenPair | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'mobile.auth.read_failed');
    return null;
  }
}

export async function storeTokens(tokens: AuthTokensResponse | TokenPair): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'mobile.auth.clear_failed');
  }
}
