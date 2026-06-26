import { Module } from '@nestjs/common';
import { PresignUploadUseCase } from './application/presign-upload.use-case';
import { UploadsController } from './interfaces/http/uploads.controller';

/** Firma de subidas directas a S3 (URLs prefirmadas, §5). StoragePort es global. */
@Module({
  controllers: [UploadsController],
  providers: [PresignUploadUseCase],
})
export class UploadsModule {}
