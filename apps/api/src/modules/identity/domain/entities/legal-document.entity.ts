export type LegalDocType = 'terms' | 'privacy' | 'refund_policy';

export interface LegalDocumentProps {
  id: string;
  docType: LegalDocType;
  version: string;
  contentUrl: string;
  isCurrent: boolean;
  publishedAt: Date;
}

/**
 * Documento legal versionado (§4.1). Invariante: solo uno "current" por tipo
 * (reforzado por índice único parcial en DB; al publicar uno nuevo se supersede
 * el anterior en la misma transacción).
 */
export class LegalDocument {
  private constructor(private readonly props: LegalDocumentProps) {}

  static publish(input: {
    id: string;
    docType: LegalDocType;
    version: string;
    contentUrl: string;
  }): LegalDocument {
    return new LegalDocument({
      id: input.id,
      docType: input.docType,
      version: input.version,
      contentUrl: input.contentUrl,
      isCurrent: true,
      publishedAt: new Date(),
    });
  }

  static fromPersistence(props: LegalDocumentProps): LegalDocument {
    return new LegalDocument(props);
  }

  /** Deja de ser la versión vigente (al publicarse una nueva). */
  supersede(): void {
    this.props.isCurrent = false;
  }

  get id(): string {
    return this.props.id;
  }
  get docType(): LegalDocType {
    return this.props.docType;
  }
  get version(): string {
    return this.props.version;
  }
  get contentUrl(): string {
    return this.props.contentUrl;
  }
  get isCurrent(): boolean {
    return this.props.isCurrent;
  }
  get publishedAt(): Date {
    return this.props.publishedAt;
  }
}
