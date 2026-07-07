/**
 * Base pública de la web para construir enlaces compartibles del promotor.
 * Punto ÚNICO (§M19): viene del env `WEB_PUBLIC_URL`, sin dominio de producción
 * hardcodeado ni persistido. Antes disperso entre `share-url.ts` (`/p/<code>`) y
 * `confirm-promoter-association` (`REFERRAL_BASE` = 'https://urnight.pe/r').
 */
const WEB_BASE = (process.env.WEB_PUBLIC_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/** Enlace corto de compartir de un código de canje: `/p/<code>`. */
export function shareUrlFor(code: string): string {
  return `${WEB_BASE}/p/${code}`;
}

/** Enlace de referido del promotor: `/r/<code>`. */
export function referralUrlFor(code: string): string {
  return `${WEB_BASE}/r/${code}`;
}
