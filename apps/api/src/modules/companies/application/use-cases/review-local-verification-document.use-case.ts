import { Inject, Injectable } from '@nestjs/common';
import type { ReviewLocalVerificationDocumentDto } from '@urnight/contracts';
import { VerificationDocumentNotFoundError } from '../../domain/errors/companies.errors';
import {
  LOCAL_VERIFICATION_DOCUMENT_REPOSITORY,
  type LocalVerificationDocumentContext,
  type LocalVerificationDocumentRepository,
} from '../../domain/ports/local-verification-document.repository';
import { RefreshLocalVerificationUseCase } from './refresh-local-verification.use-case';

@Injectable()
export class ReviewLocalVerificationDocumentUseCase {
  constructor(
    @Inject(LOCAL_VERIFICATION_DOCUMENT_REPOSITORY)
    private readonly documents: LocalVerificationDocumentRepository,
    private readonly refreshVerification: RefreshLocalVerificationUseCase,
  ) {}

  async execute(input: {
    documentId: string;
    reviewerId: string;
    dto: ReviewLocalVerificationDocumentDto;
  }): Promise<LocalVerificationDocumentContext> {
    const context = await this.documents.findByIdWithContext(input.documentId);
    if (!context) throw new VerificationDocumentNotFoundError();
    context.document.review(
      input.dto.decision,
      input.reviewerId,
      input.dto.notes,
    );
    const document = await this.documents.update(context.document);
    await this.refreshVerification.execute(context.localId);
    return { ...context, document };
  }
}
