import {
  ObjectNotFoundError,
  type ObjectMetadata,
  type StoragePort,
} from '../../adapters/storage/storage.port';

/**
 * StoragePort in-memory para unit tests: registra objetos por key con sus
 * metadatos y simula head/copy/delete sin tocar S3. `seed()` da de alta un
 * objeto (p. ej. una key de staging que el caso de uso va a promover).
 */
export class FakeStorage implements StoragePort {
  private readonly objects = new Map<string, ObjectMetadata>();

  seed(key: string, meta: Partial<ObjectMetadata> = {}): void {
    this.objects.set(key, {
      sizeBytes: meta.sizeBytes ?? 1024,
      contentType: meta.contentType ?? 'image/jpeg',
    });
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }

  getUploadUrl(key: string): Promise<string> {
    return Promise.resolve(`https://storage.test/upload/${key}`);
  }

  getDownloadUrl(key: string): Promise<string> {
    return Promise.resolve(`https://storage.test/download/${key}`);
  }

  putObject(key: string, body: Buffer | Uint8Array | string, contentType: string): Promise<void> {
    this.objects.set(key, { sizeBytes: typeof body === 'string' ? body.length : body.byteLength, contentType });
    return Promise.resolve();
  }

  headObject(key: string): Promise<ObjectMetadata> {
    const meta = this.objects.get(key);
    if (!meta) return Promise.reject(new ObjectNotFoundError(key));
    return Promise.resolve(meta);
  }

  copyObject(fromKey: string, toKey: string): Promise<void> {
    const meta = this.objects.get(fromKey);
    if (!meta) return Promise.reject(new ObjectNotFoundError(fromKey));
    this.objects.set(toKey, meta);
    return Promise.resolve();
  }

  deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
    return Promise.resolve();
  }

  resolveUrl(ref: string): string {
    return ref.startsWith('http') ? ref : `https://storage.test/${ref}`;
  }

  toKey(ref: string): string {
    return ref;
  }
}
