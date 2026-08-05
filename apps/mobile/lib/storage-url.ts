/**
 * Resolución de referencias de object storage, sin dependencias de plataforma
 * (por eso es testeable). Espejo de `resolve()` en
 * `apps/web/lib/storage/storage-context.tsx`: una key de S3 se compone con la
 * base pública, y una URL absoluta pasa tal cual (seeds y externas).
 */
export function joinStorageUrl(
  baseUrl: string,
  ref: string | null | undefined,
): string | null {
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return ref;
  return `${baseUrl.replace(/\/+$/, '')}/${ref.replace(/^\/+/, '')}`;
}
