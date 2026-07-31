import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type ConfirmLocalVerificationDocumentDto,
} from '@urnight/contracts';
import {
  ObjectNotFoundError,
  STORAGE_PORT,
  type StoragePort,
} from '../../../../shared/adapters/storage/storage.port';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { LocalVerificationDocument } from '../../domain/entities/local-verification-document.entity';
import { LocalVerification } from '../../domain/entities/local-verification.entity';
import {
  InvalidUploadError,
  LocalNotFoundError,
  UploadNotFoundError,
} from '../../domain/errors/companies.errors';
import {
  LOCAL_REPOSITORY,
  type LocalRepository,
} from '../../domain/ports/local.repository';
import {
  LOCAL_VERIFICATION_DOCUMENT_REPOSITORY,
  type LocalVerificationDocumentContext,
  type LocalVerificationDocumentRepository,
} from '../../domain/ports/local-verification-document.repository';
import {
  LOCAL_VERIFICATION_REPOSITORY,
  type LocalVerificationRepository,
} from '../../domain/ports/local-verification.repository';
import { RefreshLocalVerificationUseCase } from './refresh-local-verification.use-case';

@Injectable()
export class ConfirmLocalVerificationDocumentUseCase {
  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    @Inject(LOCAL_VERIFICATION_REPOSITORY)
    private readonly verifications: LocalVerificationRepository,
    @Inject(LOCAL_VERIFICATION_DOCUMENT_REPOSITORY)
    private readonly documents: LocalVerificationDocumentRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly refreshVerification: RefreshLocalVerificationUseCase,
  ) {}

  async execute(input: {
    localId: string;
    scope: TenantScope;
    dto: ConfirmLocalVerificationDocumentDto;
  }): Promise<LocalVerificationDocumentContext> {
    const local = await this.locals.findById(input.localId);
    if (!local) throw new LocalNotFoundError();
    assertTenant(input.scope, local.companyId);
    if (!input.dto.key.startsWith('tmp/')) {
      throw new InvalidUploadError('La key de subida no es de staging.');
    }

    let metadata;
    try {
      metadata = await this.storage.headObject(input.dto.key);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) throw new UploadNotFoundError();
      throw error;
    }
    if (metadata.sizeBytes > MAX_DOCUMENT_BYTES) {
      await this.storage.deleteObject(input.dto.key);
      throw new InvalidUploadError('El documento supera el tamaño máximo permitido.');
    }
    if (
      !(ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(
        metadata.contentType ?? '',
      )
    ) {
      await this.storage.deleteObject(input.dto.key);
      throw new InvalidUploadError('Tipo de documento no permitido.');
    }

    let verification = await this.verifications.findLatestByLocalId(local.id);
    if (!verification || verification.status !== 'pending') {
      verification = await this.verifications.create(
        LocalVerification.request({ id: randomUUID(), localId: local.id }),
      );
    }

    const filename = input.dto.key.slice('tmp/'.length);
    const finalKey = `locals/${local.id}/verification/${filename}`;
    await this.storage.copyObject(input.dto.key, finalKey);
    await this.storage.deleteObject(input.dto.key);

    const document = await this.documents.create(
      LocalVerificationDocument.create({
        id: randomUUID(),
        verificationId: verification.id,
        documentType: input.dto.documentType,
        storageKey: finalKey,
        issuedAt: input.dto.issuedAt,
        expiresAt: input.dto.expiresAt,
      }),
    );
    await this.refreshVerification.execute(local.id);
    return {
      document,
      localId: local.id,
      localName: local.name,
      companyId: local.companyId,
    };
  }
}
