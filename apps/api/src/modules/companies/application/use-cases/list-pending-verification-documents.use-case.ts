import { Inject, Injectable } from '@nestjs/common';
import {
  LOCAL_VERIFICATION_DOCUMENT_REPOSITORY,
  type LocalVerificationDocumentContext,
  type LocalVerificationDocumentRepository,
} from '../../domain/ports/local-verification-document.repository';

@Injectable()
export class ListPendingVerificationDocumentsUseCase {
  constructor(
    @Inject(LOCAL_VERIFICATION_DOCUMENT_REPOSITORY)
    private readonly documents: LocalVerificationDocumentRepository,
  ) {}

  execute(): Promise<LocalVerificationDocumentContext[]> {
    return this.documents.listPending();
  }
}
