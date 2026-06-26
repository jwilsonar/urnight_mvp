/** Base pública de la web (para construir enlaces compartibles `/p/<code>`). */
const WEB_BASE = (process.env.WEB_PUBLIC_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/** Enlace corto de compartir de un código promocional. */
export function shareUrlFor(code: string): string {
  return `${WEB_BASE}/p/${code}`;
}
