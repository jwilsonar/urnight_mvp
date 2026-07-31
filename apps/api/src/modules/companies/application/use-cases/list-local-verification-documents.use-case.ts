import { Inject, Injectable } from '@nestjs/common';
import { assertTenant, type TenantScope } from '../../../../shared/tenant/tenant-scope';
import { LocalNotFoundError } from '../../domain/errors/companies.errors';
import {
  LOCAL_REPOSITORY,
  type LocalRepository,
} from '../../domain/ports/local.repository';
import {
  LOCAL_VERIFICATION_DOCUMENT_REPOSITORY,
  type LocalVerificationDocumentContext,
  type LocalVerificationDocumentRepository,
} from '../../domain/ports/local-verification-document.repository';

@Injectable()
export class ListLocalVerificationDocumentsUseCase {
  constructor(
    @Inject(LOCAL_REPOSITORY) private readonly locals: LocalRepository,
    @Inject(LOCAL_VERIFICATION_DOCUMENT_REPOSITORY)
    private readonly documents: LocalVerificationDocumentRepository,
  ) {}

  async execute(
    localId: string,
    scope: TenantScope,
  ): Promise<LocalVerificationDocumentContext[]> {
    const local = await this.locals.findById(localId);
    if (!local) throw new LocalNotFoundError();
    assertTenant(scope, local.companyId);
    return this.documents.listByLocalId(localId);
  }
}
