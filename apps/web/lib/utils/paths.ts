/**
 * Solo permitimos rutas internas (empiezan por "/" pero NO por "//") como destino
 * de `callbackUrl`, para evitar open-redirects (auditoría M10 / B8). Fuente única
 * reutilizada por login, register, post-login y onboarding.
 */
export function isSafeInternalPath(path: string | undefined | null): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}
