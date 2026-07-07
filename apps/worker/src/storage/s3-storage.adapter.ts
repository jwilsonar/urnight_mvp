import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { createLogger } from '../logging/logger';
import { StoragePort } from './storage.port';

/**
 * Adapter S3 real del Worker (A5). Sube el PDF de entradas a S3/LocalStack de
 * verdad (no a un log). Equivalente al `S3StorageAdapter` de la API pero acotado
 * a `putObject` (única operación que el worker necesita) usando las MISMAS env
 * vars, para no importar código cross-app. Local => LocalStack vía AWS_ENDPOINT;
 * prod => AWS real. Devuelve la KEY (§ storage: se persiste la key, no la URL).
 */
@Injectable()
export class S3StorageAdapter extends StoragePort {
  private readonly log = createLogger(S3StorageAdapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService<Env, true>) {
    super();
    const endpoint = config.get('AWS_ENDPOINT', { infer: true }) || undefined;
    const region = config.getOrThrow('AWS_REGION', { infer: true });
    this.bucket = config.getOrThrow('S3_BUCKET', { infer: true });
    this.client = new S3Client({
      region,
      endpoint, // local: http://localhost:4566 · prod: undefined => AWS real
      forcePathStyle: Boolean(endpoint), // requerido por LocalStack
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: config.getOrThrow('AWS_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: config.getOrThrow('AWS_SECRET_ACCESS_KEY', { infer: true }),
      },
    });
    this.log.info({ bucket: this.bucket, endpoint: endpoint ?? 'aws' }, 'worker.storage.ready');
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    this.log.debug({ key, contentType, bytes: body.length }, 'worker.storage.put');
    return key;
  }
}
