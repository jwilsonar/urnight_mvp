import { Inject, Injectable } from '@nestjs/common';
import type { LegalDocType } from '@urnight/contracts';
import type { LegalDocument } from '../../domain/entities/legal-document.entity';
import { LegalDocumentNotFoundError } from '../../domain/errors/identity.errors';
import {
  LEGAL_DOCUMENT_REPOSITORY,
  type LegalDocumentRepository,
} from '../../domain/ports/legal.repository';

/** Caso de uso (lectura): documento legal vigente de un tipo. Público. */
@Injectable()
export class GetCurrentLegalDocumentUseCase {
  constructor(
    @Inject(LEGAL_DOCUMENT_REPOSITORY)
    private readonly documents: LegalDocumentRepository,
  ) {}

  async execute(input: { docType: LegalDocType }): Promise<LegalDocument> {
    const document = await this.documents.findCurrent(input.docType);
    if (!document) throw new LegalDocumentNotFoundError();
    return document;
  }
}
