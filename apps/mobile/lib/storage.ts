import Constants from 'expo-constants';
import { joinStorageUrl } from './storage-url';

/**
 * Base pública del object storage. Mismo problema y misma solución que
 * `resolveApiUrl()` en `lib/api-client.ts`: en dispositivo físico `localhost`
 * apunta al teléfono, así que se deriva la IP del host de Metro (`hostUri`).
 * LocalStack escucha en 4566 (ver `.env.example`).
 */
function resolveStorageBase(): string {
  if (process.env.EXPO_PUBLIC_STORAGE_URL) return process.env.EXPO_PUBLIC_STORAGE_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:4566` : 'http://localhost:4566';
}

const STORAGE_URL = resolveStorageBase();

/** Key de S3 (o URL absoluta) a URL renderizable. `null` si no hay referencia. */
export function resolveStorageUrl(ref: string | null | undefined): string | null {
  return joinStorageUrl(STORAGE_URL, ref);
}
