import type { LocalVerificationDocument } from '../entities/local-verification-document.entity';

export interface LocalVerificationDocumentContext {
  document: LocalVerificationDocument;
  localId: string;
  localName: string;
  companyId: string;
}

export interface LocalVerificationDocumentRepository {
  create(document: LocalVerificationDocument): Promise<LocalVerificationDocument>;
  update(document: LocalVerificationDocument): Promise<LocalVerificationDocument>;
  findByIdWithContext(id: string): Promise<LocalVerificationDocumentContext | null>;
  listByLocalId(localId: string): Promise<LocalVerificationDocumentContext[]>;
  listPending(): Promise<LocalVerificationDocumentContext[]>;
}

export const LOCAL_VERIFICATION_DOCUMENT_REPOSITORY = Symbol(
  'LOCAL_VERIFICATION_DOCUMENT_REPOSITORY',
);
