/**
 * Base pública de la web. Punto ÚNICO (§M19): sale del env `WEB_PUBLIC_URL`, sin
 * dominio de producción hardcodeado ni persistido. Vive en `shared` porque la
 * necesitan varios módulos (promotores para enlaces de referido, identidad para
 * el enlace de verificación de correo).
 */
export const WEB_BASE = (process.env.WEB_PUBLIC_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

/** Construye un enlace absoluto de la web a partir de una ruta (`/verify-email`). */
export function webUrlFor(path: string): string {
  return `${WEB_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
