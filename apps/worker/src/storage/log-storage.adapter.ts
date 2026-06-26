import { Injectable } from '@nestjs/common';
import { createLogger } from '../logging/logger';
import { StoragePort } from './storage.port';

/**
 * Adapter mock de storage (§1.5): registra el objeto y devuelve su key. Se
 * sustituye por el adapter S3 (putObject) sin tocar los processors.
 */
@Injectable()
export class LogStorageAdapter extends StoragePort {
  private readonly log = createLogger(LogStorageAdapter.name);

  async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    this.log.info({ key, bytes: body.length, contentType }, 'worker.storage.put');
    return key;
  }
}
