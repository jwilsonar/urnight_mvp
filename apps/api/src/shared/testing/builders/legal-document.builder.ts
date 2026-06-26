import { randomUUID } from 'node:crypto';
import {
  LegalDocument,
  type LegalDocType,
} from '../../../modules/identity/domain/entities/legal-document.entity';

/** Builder fluido para LegalDocument (publish). */
export class LegalDocumentBuilder {
  private id: string = randomUUID();
  private docType: LegalDocType = 'terms';
  private version = '1.0';
  private contentUrl = 'https://cdn.urnight.pe/legal/terms-1.0.pdf';

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withDocType(docType: LegalDocType): this {
    this.docType = docType;
    return this;
  }

  withVersion(version: string): this {
    this.version = version;
    return this;
  }

  withContentUrl(contentUrl: string): this {
    this.contentUrl = contentUrl;
    return this;
  }

  build(): LegalDocument {
    return LegalDocument.publish({
      id: this.id,
      docType: this.docType,
      version: this.version,
      contentUrl: this.contentUrl,
    });
  }
}
