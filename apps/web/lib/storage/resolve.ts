/**
 * Resolución de referencias de object storage (key de S3 → URL absoluta),
 * segura en servidor y cliente. Misma política que `StorageProvider.resolve`
 * (storage-context.tsx) pero sin React, para usarse en `generateMetadata` y
 * otros contextos de servidor donde no hay Context disponible.
 */
export const STORAGE_BASE_URL = (process.env.NEXT_PUBLIC_STORAGE_URL ?? 'http://localhost:4566').replace(
  /\/+$/,
  '',
);

/** key de S3 → URL absoluta; una URL http(s) ya absoluta (seed/externa) se devuelve tal cual. */
export function resolveStorageUrl(ref: string): string {
  return /^https?:\/\//i.test(ref) ? ref : `${STORAGE_BASE_URL}/${ref.replace(/^\/+/, '')}`;
}
