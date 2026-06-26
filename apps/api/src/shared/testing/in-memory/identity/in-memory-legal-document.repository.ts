import type {
  LegalDocType,
  LegalDocument,
} from '../../../../modules/identity/domain/entities/legal-document.entity';
import type { LegalDocumentRepository } from '../../../../modules/identity/domain/ports/legal.repository';
import { InMemoryRepository } from '../in-memory.repository';

/** LegalDocumentRepository en memoria. `publish` supersede al vigente del mismo tipo. */
export class InMemoryLegalDocumentRepository
  extends InMemoryRepository<LegalDocument>
  implements LegalDocumentRepository
{
  /** Precarga un documento (p.ej. el vigente) sin pasar por publish/supersede. */
  seed(document: LegalDocument): this {
    this.put(document);
    return this;
  }

  async findById(id: string): Promise<LegalDocument | null> {
    return this.getById(id);
  }

  async findCurrent(docType: LegalDocType): Promise<LegalDocument | null> {
    return this.values().find((d) => d.docType === docType && d.isCurrent) ?? null;
  }

  async publish(next: LegalDocument): Promise<LegalDocument> {
    for (const doc of this.values()) {
      if (doc.docType === next.docType && doc.isCurrent && doc.id !== next.id) {
        doc.supersede();
      }
    }
    this.put(next);
    return next;
  }
}
