/**
 * Puerto OUT de almacenamiento de objetos (S3-compatible). El dominio/casos de
 * uso dependen de esta interfaz, no de AWS SDK (Anti-Corruption Layer §3.2).
 * El cliente sube/descarga directo con URLs firmadas; la API solo firma (§5).
 */
export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
  /** URL firmada para que el cliente SUBA un objeto directamente (HTTP PUT). */
  getUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>;

  /** URL firmada para DESCARGAR un objeto privado (HTTP GET). */
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /** Sube un objeto desde el servidor (ej. PDFs del Worker tras OrderPaid). */
  putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
  ): Promise<void>;

  /** Metadatos de un objeto (verificación de size/mime reales en el confirm). */
  headObject(key: string): Promise<ObjectMetadata>;

  /** Copia un objeto dentro del mismo bucket (staging tmp/ → key final). */
  copyObject(fromKey: string, toKey: string): Promise<void>;

  /** Elimina un objeto. */
  deleteObject(key: string): Promise<void>;

  /**
   * Resuelve una referencia de imagen a su URL pública (no firmada) en lectura.
   * - key de S3 → `${publicBase}/${key}` (CDN/endpoint del entorno actual).
   * - URL absoluta (http/https) → se devuelve tal cual (imágenes externas/seed).
   * Persistir la key (no la URL) mantiene los datos independientes del entorno.
   */
  resolveUrl(ref: string): string;

  /** Key de S3 a partir de una referencia (key tal cual; o derivada de una URL). */
  toKey(ref: string): string;
}

/** Metadatos devueltos por headObject. */
export interface ObjectMetadata {
  /** Tamaño real en bytes según S3. */
  sizeBytes: number;
  /** Content-Type real con el que se almacenó el objeto. */
  contentType: string | undefined;
}

/** Lanzado por headObject cuando el objeto no existe (key sin subir / expirado). */
export class ObjectNotFoundError extends Error {
  constructor(readonly key: string) {
    super(`Objeto no encontrado en storage: ${key}`);
    this.name = 'ObjectNotFoundError';
  }
}
