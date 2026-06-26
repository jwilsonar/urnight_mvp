import type { LegalAcceptance } from '../entities/legal-acceptance.entity';
import type { LegalDocType, LegalDocument } from '../entities/legal-document.entity';

/** Puerto del repositorio de documentos legales. */
export interface LegalDocumentRepository {
  findById(id: string): Promise<LegalDocument | null>;
  /** Documento vigente (is_current) de un tipo. */
  findCurrent(docType: LegalDocType): Promise<LegalDocument | null>;
  /** Publica el nuevo doc y supersede al vigente en una sola operación atómica. */
  publish(next: LegalDocument): Promise<LegalDocument>;
}

export const LEGAL_DOCUMENT_REPOSITORY = Symbol('LEGAL_DOCUMENT_REPOSITORY');

/** Puerto del repositorio de aceptaciones legales. */
export interface LegalAcceptanceRepository {
  create(acceptance: LegalAcceptance): Promise<LegalAcceptance>;
  findByUser(userId: string): Promise<LegalAcceptance[]>;
}

export const LEGAL_ACCEPTANCE_REPOSITORY = Symbol('LEGAL_ACCEPTANCE_REPOSITORY');
