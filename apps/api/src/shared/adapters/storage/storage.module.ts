import { Global, Module } from '@nestjs/common';
import { S3StorageAdapter } from './s3-storage.adapter';
import { STORAGE_PORT } from './storage.port';

/** Provee STORAGE_PORT (S3) de forma global. Inyectar con @Inject(STORAGE_PORT). */
@Global()
@Module({
  providers: [{ provide: STORAGE_PORT, useClass: S3StorageAdapter }],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
