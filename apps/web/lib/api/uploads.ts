import type { PresignRequestDto, PresignResponseDto, UploadScope } from '@urnight/contracts';
import { apiFetch } from './client';

/** Pide al API una URL firmada para subir a staging (tmp/). */
export function presignUpload(body: PresignRequestDto, token: string, signal?: AbortSignal) {
  return apiFetch<PresignResponseDto>('/uploads/presign', {
    method: 'POST',
    json: body,
    token,
    signal,
  });
}

/** ¿Es una cancelación deliberada (AbortController) y no un fallo real? */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * PUT directo del binario a S3. Usa XHR (no fetch) porque solo XHR expone el
 * progreso de subida. No lleva Authorization: la URL ya va firmada. `signal`
 * permite cancelar la subida en vuelo (rechaza con AbortError, igual que fetch).
 */
export function putToSignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('Subida cancelada', 'AbortError');
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Error al subir a S3 (HTTP ${xhr.status})`));
    xhr.onerror = () => reject(new Error('Fallo de red al subir el archivo.'));
    xhr.onabort = () => reject(abortError());
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/**
 * Orquesta presign + PUT y devuelve la key de staging para el confirm.
 * El tipo/tamaño deben validarse antes (el dropzone lo hace con el Zod compartido).
 */
export async function uploadToStaging(
  file: File,
  scope: UploadScope,
  token: string,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { uploadUrl, key } = await presignUpload(
    {
      scope,
      contentType: file.type as PresignRequestDto['contentType'],
      sizeBytes: file.size,
    },
    token,
    signal,
  );
  await putToSignedUrl(uploadUrl, file, onProgress, signal);
  return key;
}
