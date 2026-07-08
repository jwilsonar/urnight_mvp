/**
 * Solo permitimos rutas internas como destino de `callbackUrl`, para evitar
 * open-redirects (auditoría M10 / B8). Fuente única reutilizada por login,
 * register, post-login y onboarding. Reglas, cada una con su vector de ataque:
 *
 * 1. Longitud 1..2048 — corta payloads absurdos.
 * 2. Empieza por '/' — solo paths relativos al propio origen.
 * 3. Sin backslash ni caracteres de control en NINGUNA posición — los browsers
 *    normalizan '/\evil.com' a '//evil.com' (URL protocolo-relativa) y CR/LF/tab
 *    permiten esconder el host real o partir headers.
 * 4. El segundo carácter no puede reconstituir una autoridad — '//evil.com'
 *    directo y las variantes percent-encoded '/%2F…' / '/%5C…' que algunos
 *    parsers decodifican antes de navegar.
 * 5. Red de seguridad canónica — parseado contra un origen de control, el path
 *    no debe cambiar de origen (cubre vectores no contemplados arriba).
 *
 * Deliberadamente NO se rechaza '%2F' más allá del prefijo: destinos legítimos
 * como '/login?callbackUrl=%2Fpanel' viajan percent-encoded dentro del query y
 * se usan sin decodificar.
 */
const MAX_PATH_LENGTH = 2048;
const PROBE_ORIGIN = 'http://internal.local';

/** Control chars C0 (0x00-0x1F), DEL (0x7F) o backslash en cualquier posición. */
function hasControlOrBackslash(path: string): boolean {
  for (const ch of path) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f || ch === '\\') return true;
  }
  return false;
}

/** '//', '/%2F…' o '/%5C…': el segundo segmento reconstituye una autoridad. */
function hasAuthorityPrefix(path: string): boolean {
  const rest = path.slice(1, 4).toLowerCase();
  return rest.startsWith('/') || rest.startsWith('%2f') || rest.startsWith('%5c');
}

export function isSafeInternalPath(path: string | undefined | null): path is string {
  if (typeof path !== 'string' || path.length === 0 || path.length > MAX_PATH_LENGTH) return false;
  if (!path.startsWith('/')) return false;
  if (hasControlOrBackslash(path)) return false;
  if (hasAuthorityPrefix(path)) return false;
  try {
    return new URL(path, PROBE_ORIGIN).origin === PROBE_ORIGIN;
  } catch {
    return false;
  }
}
