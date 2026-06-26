import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env.schema';
import { createLogger } from '../../logging/logger';
import { ObjectNotFoundError, type ObjectMetadata, type StoragePort } from './storage.port';

/** Adapter S3 (driven). Local => LocalStack vía AWS_ENDPOINT; prod => AWS real. */
@Injectable()
export class S3StorageAdapter implements StoragePort {
  private readonly log = createLogger(S3StorageAdapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  /** Base pública sin barra final para construir/parsear URLs de catálogo. */
  private readonly publicBase: string;

  constructor(config: ConfigService<Env, true>) {
    const endpoint = config.get('AWS_ENDPOINT', { infer: true }) || undefined;
    const region = config.getOrThrow('AWS_REGION', { infer: true });
    this.bucket = config.getOrThrow('S3_BUCKET', { infer: true });
    this.client = new S3Client({
      region,
      endpoint, // local: http://localhost:4566 · prod: undefined => AWS real
      forcePathStyle: Boolean(endpoint), // requerido por LocalStack
      // El SDK v3.729+ añade x-amz-checksum-crc32 a los PUT firmados por defecto;
      // el navegador no puede calcularlo y el PUT directo falla. WHEN_REQUIRED
      // desactiva ese checksum para que la URL firmada solo exija Content-Type.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: config.getOrThrow('AWS_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: config.getOrThrow('AWS_SECRET_ACCESS_KEY', { infer: true }),
      },
    });
    // Prioridad: S3_PUBLIC_URL (CDN) → endpoint path-style (LocalStack) → virtual-hosted AWS.
    const configured = config.get('S3_PUBLIC_URL', { infer: true });
    const derived = endpoint
      ? `${endpoint}/${this.bucket}`
      : `https://${this.bucket}.s3.${region}.amazonaws.com`;
    this.publicBase = (configured && configured.length ? configured : derived).replace(/\/+$/, '');
    this.log.info({ bucket: this.bucket, endpoint: endpoint ?? 'aws' }, 'storage.ready');
  }

  getUploadUrl(key: string, contentType: string, expiresInSeconds = 900): Promise<string> {
    const cmd = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    this.log.debug({ key, contentType, expiresInSeconds }, 'storage.presign.upload');
    return getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
  }

  getDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    this.log.debug({ key, expiresInSeconds }, 'storage.presign.download');
    return getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
  }

  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    this.log.debug({ key, contentType }, 'storage.put');
  }

  async headObject(key: string): Promise<ObjectMetadata> {
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { sizeBytes: res.ContentLength ?? 0, contentType: res.ContentType };
    } catch (err) {
      if (err instanceof S3ServiceException && (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404)) {
        this.log.warn({ key }, 'storage.head.miss');
        throw new ObjectNotFoundError(key);
      }
      this.log.error({ key, err }, 'storage.head.error');
      throw err;
    }
  }

  async copyObject(fromKey: string, toKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${encodeURIComponent(fromKey)}`,
        Key: toKey,
      }),
    );
    this.log.debug({ fromKey, toKey }, 'storage.copy');
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.log.debug({ key }, 'storage.delete');
  }

  resolveUrl(ref: string): string {
    // Imágenes externas/seed ya son URLs absolutas: passthrough sin tocar.
    if (/^https?:\/\//i.test(ref)) return ref;
    return `${this.publicBase}/${ref}`;
  }

  toKey(ref: string): string {
    // Referencia ya es una key (caso normal: objetos gestionados).
    if (!/^https?:\/\//i.test(ref)) return ref;
    // URL absoluta (legado): quita base pública o, en su defecto, esquema+host
    // (+ posible segmento de bucket) para recuperar la key del objeto.
    const prefix = `${this.publicBase}/`;
    if (ref.startsWith(prefix)) return ref.slice(prefix.length);
    const path = ref.replace(/^https?:\/\/[^/]+\//, '');
    return path.startsWith(`${this.bucket}/`) ? path.slice(this.bucket.length + 1) : path;
  }
}
