/**
 * Reglas puras de sesión del validador (§2 del diseño). Sin imports de Expo ni
 * de React Native a propósito: es lo que permite probarlas en Vitest sin montar
 * la plataforma. Lo que toca almacenamiento seguro vive en `lib/auth.ts`.
 */

export interface AccessClaims {
  sub?: string;
  email?: string;
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

/** Claims del token. Se leen aunque `exp` ya haya pasado: el rol sigue siendo legible. */
export function claimsOf(token: string | null | undefined): AccessClaims | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  return decodeSegment(payload);
}

/**
 * ¿El token sigue vigente? Margen de 30 s igual que la web (`SKEW_SECONDS` en
 * `apps/web/lib/auth.ts`) para no usar un access a punto de expirar.
 */
export function isTokenFresh(token: string | null | undefined, skewSeconds = 30): boolean {
  const claims = claimsOf(token);
  if (typeof claims?.exp !== 'number') return false;
  return (claims.exp - skewSeconds) * 1000 > Date.now();
}

/** ¿Los claims portan rol `validator`? El servidor verifica la firma; esto es gating de UX. */
export function hasValidatorRole(claims: AccessClaims | null): boolean {
  return claims?.roles?.includes('validator') === true;
}

/**
 * Qué hacer con el par guardado antes de una petición autenticada.
 *
 * `dead` es lo único que expulsa a login. Un access vencido con refresh vigente
 * NO es sesión muerta: es una renovación pendiente.
 */
export function sessionActionFor(pair: {
  accessToken: string | null;
  refreshToken: string | null;
}): 'use' | 'refresh' | 'dead' {
  if (!pair.refreshToken || !isTokenFresh(pair.refreshToken, 0)) return 'dead';
  if (!hasValidatorRole(claimsOf(pair.accessToken))) return 'dead';
  return isTokenFresh(pair.accessToken) ? 'use' : 'refresh';
}

/**
 * Qué hacer cuando la renovación falla. `status` es `null` si no hubo respuesta
 * del servidor (fallo de red): la puerta sigue operando y encolando (§2.5).
 * Solo un rechazo explícito del refresh mata la sesión.
 */
export function refreshFailureAction(status: number | null): 'offline' | 'dead' {
  if (status === null) return 'offline';
  return status === 401 || status === 400 ? 'dead' : 'offline';
}
