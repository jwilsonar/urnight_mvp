import type { LegalDocument } from '../../../modules/identity/domain/entities/legal-document.entity';
import { LegalDocumentBuilder } from '../builders/legal-document.builder';

/** Documentos legales vigentes predefinidos. */
export const LegalDocumentMother = {
  currentTerms: (): LegalDocument =>
    new LegalDocumentBuilder().withDocType('terms').withVersion('1.0').build(),
  currentPrivacy: (): LegalDocument =>
    new LegalDocumentBuilder().withDocType('privacy').withVersion('1.0').build(),
};
